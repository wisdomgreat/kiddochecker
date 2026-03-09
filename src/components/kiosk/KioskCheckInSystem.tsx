
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, UserCheck, CheckCircle, AlertCircle, Maximize, Loader2,
  Info, MapPin, Shield, KeyRound, UserCog, LogIn, LogOut, QrCode,
  Camera, Baby, Phone, User, ArrowRight, Printer, Mail,
} from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import ClassSelectionDialog from './ClassSelectionDialog';
import NameTagPrintDialog from './NameTagPrintDialog';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  age?: number;
  allergies?: string;
}

interface GeoLocation { latitude: number; longitude: number; accuracy: number; }

type KioskTab = 'parent' | 'staff' | 'checkout';

const KioskCheckInSystem = () => {
  // ─── Core State ───
  const [activeTab, setActiveTab] = useState<KioskTab>('parent');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayCount, setTodayCount] = useState(0);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ─── Parent Login ───
  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [parentLoggedIn, setParentLoggedIn] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentChildren, setParentChildren] = useState<Child[]>([]);
  const [parentLoginError, setParentLoginError] = useState('');
  const [checkedInChildIds, setCheckedInChildIds] = useState<Set<string>>(new Set());

  // ─── Staff Search ───
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<Child[]>([]);
  const [staffAuthed, setStaffAuthed] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');

  // ─── Check-Out ───
  const [checkoutSearch, setCheckoutSearch] = useState('');
  const [checkedInChildren, setCheckedInChildren] = useState<any[]>([]);
  const [checkoutFilteredChildren, setCheckoutFilteredChildren] = useState<any[]>([]);

  // ─── Class & Print ───
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showNameTagDialog, setShowNameTagDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkInQRData, setCheckInQRData] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');

  const phoneRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { sendCheckInNotification, sendCheckOutNotification } = useEmailNotifications();

  // ─── Boot ───
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    loadTodayData();
    requestGeo();
  }, []);

  useEffect(() => {
    let wl: any = null;
    const req = async () => { try { if ('wakeLock' in navigator) wl = await (navigator as any).wakeLock.request('screen'); } catch {} };
    req();
    const vis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); if (wl) wl.release(); };
  }, []);

  const requestGeo = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        p => setGeoLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => {}, { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const toggleFs = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const loadTodayData = async () => {
    try {
      const data = await AttendanceService.getTodaysAttendance();
      setTodayCount(data.length);
      const ids = new Set<string>();
      const checkedIn: any[] = [];
      data.forEach((r: any) => { if (!r.checked_out_at) { ids.add(r.child_id); checkedIn.push(r); } });
      setCheckedInChildIds(ids);
      setCheckedInChildren(checkedIn);
      setCheckoutFilteredChildren(checkedIn);
    } catch { setTodayCount(0); }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const logActivity = async (action: string, metadata: any) => {
    if (geoLocation) {
      metadata.lat = geoLocation.latitude;
      metadata.lon = geoLocation.longitude;
      metadata.acc = geoLocation.accuracy;
    }
    metadata.ts = new Date().toISOString();
    try { await (supabase.from('device_activity_log' as any) as any).insert({ action, metadata }); } catch {}
  };

  // ═══════════════════════════════════════════════════════
  // PARENT LOGIN
  // ═══════════════════════════════════════════════════════
  const handleParentLogin = async () => {
    if (!parentPhone.trim() || !parentPin.trim()) {
      setParentLoginError('Please enter your phone/name and PIN');
      return;
    }
    if (parentPin.length < 4) {
      setParentLoginError('PIN must be at least 4 digits');
      return;
    }
    setIsLoading(true);
    setParentLoginError('');

    try {
      // Search for parent by phone OR name
      const searchVal = parentPhone.trim();
      const { data: profiles, error } = await (supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, security_pin, email')
        .or(`phone.ilike.%${searchVal}%,first_name.ilike.%${searchVal}%,last_name.ilike.%${searchVal}%`) as any);

      if (error || !profiles || profiles.length === 0) {
        // Fallback: try searching in auth_users_emails_view if no profile with email found?
        // Actually, we'll try to find any profile and then get email from the view
        const { data: profilesNoEmail, error: errorNoEmail } = await (supabase
          .from('profiles')
          .select('id, first_name, last_name, phone, security_pin')
          .or(`phone.ilike.%${searchVal}%,first_name.ilike.%${searchVal}%,last_name.ilike.%${searchVal}%`) as any);
        
        if (errorNoEmail || !profilesNoEmail || profilesNoEmail.length === 0) {
          setParentLoginError('No account found. Please check your details.');
          setIsLoading(false);
          return;
        }

        // Find matching PIN in the list of profiles
        const matchedProfile = profilesNoEmail.find((p: any) => p.security_pin === parentPin);
        if (!matchedProfile) {
          setParentLoginError('Incorrect PIN. Please try again.');
          setIsLoading(false);
          return;
        }

        // Try to get email from the view
        const { data: emailData } = await (supabase
          .from('auth_users_emails_view' as any)
          .select('email' as any)
          .eq('id', matchedProfile.id)
          .single() as any);
        
        (matchedProfile as any).email = emailData?.email;
        (profiles as any[])[0] = matchedProfile; // Use this as the profiles array for subsequent logic
      } else {
        // We have profiles with (potentially) email
      }

      const matched: any = (profiles as any[]).find((p: any) => p.security_pin === parentPin);
      if (!matched) {
        setParentLoginError('Incorrect PIN. Please try again.');
        setIsLoading(false);
        return;
      }

      // Load children for this parent
      const { data: kids, error: kidsError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', matched.id);

      if (kidsError) throw kidsError;

      setParentName(`${matched.first_name} ${matched.last_name}`);
      setParentChildren(kids || []);
      setParentLoggedIn(true);

      await logActivity('parent_login', { parent_id: matched.id, parent_name: `${matched.first_name} ${matched.last_name}`, email: matched.email });
    } catch (e: any) {
      setParentLoginError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParentLogout = () => {
    setParentLoggedIn(false);
    setParentName('');
    setParentChildren([]);
    setParentPhone('');
    setParentPin('');
    setParentLoginError('');
  };

  const handleParentCheckIn = (child: Child) => {
    if (checkedInChildIds.has(child.id)) {
      toast({ title: "Already Checked In", description: `${child.first_name} is already checked in today.`, variant: "destructive" });
      return;
    }
    setSelectedChild(child);
    setShowClassDialog(true);
  };

  // ═══════════════════════════════════════════════════════
  // STAFF AUTH
  // ═══════════════════════════════════════════════════════
  const handleStaffAuth = async () => {
    if (staffPinInput.length < 4) { setStaffPinError('PIN must be at least 4 digits'); return; }
    setIsLoading(true);
    try {
      const { data } = await (supabase.from('profiles').select('id, first_name, last_name').eq('security_pin', staffPinInput) as any);
      if (!data || data.length === 0) {
        setStaffPinError('Invalid staff PIN');
        setStaffPinInput('');
      } else {
        setStaffAuthed(true);
        setStaffName(`${data[0].first_name} ${data[0].last_name}`);
        setShowStaffPin(false);
        toast({ title: "Staff Authorized", description: `Welcome, ${data[0].first_name}` });
        await logActivity('staff_login', { staff_id: data[0].id, staff_name: `${data[0].first_name} ${data[0].last_name}` });
      }
    } catch { setStaffPinError('Verification failed'); }
    finally { setIsLoading(false); }
  };

  const handleStaffLogout = () => {
    setStaffAuthed(false);
    setStaffName('');
    setStaffPinInput('');
    setStaffSearchTerm('');
    setStaffSearchResults([]);
  };

  // Staff search
  useEffect(() => {
    if (!staffAuthed || staffSearchTerm.length < 3) { setStaffSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from('children').select('*')
          .or(`first_name.ilike.%${staffSearchTerm}%,last_name.ilike.%${staffSearchTerm}%`).limit(8);
        setStaffSearchResults(data || []);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [staffSearchTerm, staffAuthed]);

  const handleStaffCheckIn = (child: Child) => {
    if (checkedInChildIds.has(child.id)) {
      toast({ title: "Already Checked In", description: `${child.first_name} is already checked in.`, variant: "destructive" });
      return;
    }
    setSelectedChild(child);
    setShowClassDialog(true);
  };

  const handleQRScan = async (qrData: string) => {
    if (!staffAuthed) { toast({ title: "Staff PIN Required", description: "Please enter your staff PIN first.", variant: "destructive" }); return; }
    setIsLoading(true);
    try {
      const { data: rec, error } = await supabase.from('qr_codes').select('*, child:children(*)').eq('qr_data', qrData).eq('is_active', true).single();
      if (error || !rec) { toast({ title: "Invalid QR", description: "Code not recognized", variant: "destructive" }); return; }
      handleStaffCheckIn(rec.child as any);
    } catch { toast({ title: "Error", description: "Failed to process QR", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  // ═══════════════════════════════════════════════════════
  // CLASS SELECTED → ACTUAL CHECK-IN
  // ═══════════════════════════════════════════════════════
  const handleClassSelected = async (classId: string) => {
    if (!selectedChild) return;
    setShowClassDialog(false);
    setIsLoading(true);
    try {
      const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single();
      const result = await AttendanceService.checkInChild({ childId: selectedChild.id, classId });

      if (result.success) {
        await logActivity('check_in', {
          child_id: selectedChild.id, child_name: `${selectedChild.first_name} ${selectedChild.last_name}`,
          class_name: classData?.name, by: activeTab === 'parent' ? `parent:${parentName}` : `staff:${staffName}`,
        });

        const { data: qrCodeData } = await supabase.from('qr_codes').select('qr_data').eq('child_id', selectedChild.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
        setCheckInQRData(qrCodeData?.qr_data || '');
        setSelectedClassName(classData?.name || '');
        setCheckedInChildIds(prev => new Set([...prev, selectedChild.id]));
        showSuccess(`${selectedChild.first_name} → ${classData?.name || 'class'}`);
        await loadTodayData();

        if (selectedChild.allergies) {
          toast({ title: "⚠️ ALLERGY ALERT", description: `${selectedChild.first_name}: ${selectedChild.allergies}`, variant: "destructive", duration: 10000 });
        }
        setShowNameTagDialog(true);
      } else {
        if (result.error?.includes('already checked in')) {
          setCheckedInChildIds(prev => new Set([...prev, selectedChild.id]));
          toast({ title: "Already Checked In", description: `${selectedChild.first_name} is already checked in today.`, variant: "destructive" });
        } else {
          toast({ title: "Failed", description: result.error || "Could not check in", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Check-in failed", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  // ═══════════════════════════════════════════════════════
  // CHECK-OUT
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!checkoutSearch.trim()) { setCheckoutFilteredChildren(checkedInChildren); return; }
    const filtered = checkedInChildren.filter((r: any) => {
      const name = `${r.child?.first_name || ''} ${r.child?.last_name || ''}`.toLowerCase();
      return name.includes(checkoutSearch.toLowerCase());
    });
    setCheckoutFilteredChildren(filtered);
  }, [checkoutSearch, checkedInChildren]);

  const handleCheckOut = async (record: any) => {
    setIsLoading(true);
    try {
      const result = await AttendanceService.checkOutChild({ attendanceId: record.id });
      if (result.success) {
        await logActivity('check_out', {
          child_id: record.child_id, child_name: `${record.child?.first_name} ${record.child?.last_name}`,
        });
        
        // Notify Parent
        try {
          const parentId = record.child?.parent_id;
          if (parentId) {
            let email = '';
            const { data: profileData } = await (supabase
              .from('profiles')
              .select('email' as any)
              .eq('id', parentId)
              .single() as any);
            
            email = profileData?.email;
            
            if (!email) {
              const { data: viewData } = await (supabase
                .from('auth_users_emails_view' as any)
                .select('email' as any)
                .eq('id', parentId)
                .single() as any);
              email = viewData?.email || '';
            }

            if (email) {
              sendCheckOutNotification(email, `${record.child?.first_name} ${record.child?.last_name}`, record.class?.name || 'Class');
            }
          }
        } catch (err) {
          console.warn('Failed to send check-out notification:', err);
        }

        showSuccess(`${record.child?.first_name} checked out`);
        await loadTodayData();
        toast({ title: "✅ Checked Out", description: `${record.child?.first_name} ${record.child?.last_name}` });
      } else {
        toast({ title: "Failed", description: result.error || "Could not check out", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  const alreadyIn = (id: string) => checkedInChildIds.has(id);

  return (
    <div className="fixed inset-0 bg-[#080c1f] flex flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2 text-white/40 text-[10px] font-semibold tracking-widest uppercase">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          KiddoChecker
          {geoLocation && <MapPin className="w-2.5 h-2.5 text-emerald-400/40" />}
        </div>
        <div className="flex items-center gap-2 text-white/40 text-[10px] font-semibold">
          <Badge className="bg-indigo-500/10 text-indigo-300/60 border-indigo-500/10 text-[10px] px-2 py-0 font-semibold">{todayCount} today</Badge>
          <span className="tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={toggleFs} className="p-1 hover:bg-white/5 rounded"><Maximize className="w-3 h-3 text-white/30" /></button>
        </div>
      </div>

      {/* ─── Success Flash ─── */}
      {successMsg && (
        <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/10 rounded-lg shrink-0">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-emerald-300/70 text-xs font-medium">{successMsg}</p>
        </div>
      )}

      {/* ─── Tab Bar ─── */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex bg-white/[0.02] rounded-lg p-0.5 border border-white/[0.04]">
          {([
            { id: 'parent' as KioskTab, label: 'Parent', icon: KeyRound },
            { id: 'staff' as KioskTab, label: 'Staff', icon: UserCog },
            { id: 'checkout' as KioskTab, label: 'Check Out', icon: LogOut },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-white/25 hover:text-white/40'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* ────── PARENT TAB ────── */}
        {activeTab === 'parent' && !parentLoggedIn && (
          <div className="max-w-sm mx-auto pt-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-3">
                <LogIn className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Parent Check-In</h2>
              <p className="text-white/30 text-xs mt-1">Enter your phone number or name, and your PIN</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  ref={phoneRef}
                  value={parentPhone}
                  onChange={e => { setParentPhone(e.target.value); setParentLoginError(''); }}
                  placeholder="Phone number or your name..."
                  className="h-12 pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl text-sm"
                  autoFocus
                />
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              </div>
              <div className="relative">
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={parentPin}
                  onChange={e => { setParentPin(e.target.value.replace(/\D/g, '')); setParentLoginError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleParentLogin()}
                  placeholder="Your security PIN..."
                  className="h-12 pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl text-sm tracking-[0.3em]"
                  maxLength={8}
                />
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              </div>
              {parentLoginError && <p className="text-red-400 text-xs text-center">{parentLoginError}</p>}
              <Button onClick={handleParentLogin} disabled={isLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-1.5" />Sign In</>}
              </Button>
            </div>

            <p className="text-white/15 text-[10px] text-center flex items-center justify-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Your PIN was set during registration
            </p>
          </div>
        )}

        {activeTab === 'parent' && parentLoggedIn && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">Welcome</p>
                <h2 className="text-white text-lg font-bold">{parentName}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={handleParentLogout} className="text-white/30 hover:text-white/60 text-xs">
                <LogOut className="w-3 h-3 mr-1" /> Sign Out
              </Button>
            </div>

            {parentChildren.length === 0 ? (
              <div className="text-center py-8">
                <Baby className="w-8 h-8 mx-auto text-white/10 mb-2" />
                <p className="text-white/25 text-xs">No children linked to your account</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Your Children</p>
                {parentChildren.map(child => {
                  const checked = alreadyIn(child.id);
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleParentCheckIn(child)}
                      disabled={checked || isLoading}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left active:scale-[0.98] ${
                        checked ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${checked ? 'bg-emerald-500/15' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                        {checked ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span className="text-white font-bold text-sm">{child.first_name[0]}{child.last_name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm">{child.first_name} {child.last_name}</h3>
                        <div className="flex gap-2 mt-0.5">
                          {child.age && <span className="text-white/20 text-[10px]">Age {child.age}</span>}
                          {child.allergies && <Badge className="bg-red-500/10 text-red-400/60 border-0 text-[9px] px-1 py-0">⚠ Allergy</Badge>}
                          {checked && <span className="text-emerald-400/50 text-[10px]">✓ Checked in</span>}
                        </div>
                      </div>
                      {!checked && <ArrowRight className="w-4 h-4 text-white/15" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ────── STAFF TAB ────── */}
        {activeTab === 'staff' && !staffAuthed && (
          <div className="max-w-sm mx-auto pt-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-3">
                <UserCog className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Staff Check-In</h2>
              <p className="text-white/30 text-xs mt-1">Enter your personal staff PIN to begin</p>
            </div>

            <div className="space-y-3">
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={staffPinInput}
                onChange={e => { setStaffPinInput(e.target.value.replace(/\D/g, '')); setStaffPinError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleStaffAuth()}
                placeholder="Staff PIN..."
                className="h-14 text-center text-xl tracking-[0.5em] bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl"
                maxLength={8}
                autoFocus
              />
              {staffPinError && <p className="text-red-400 text-xs text-center">{staffPinError}</p>}
              <Button onClick={handleStaffAuth} disabled={isLoading || staffPinInput.length < 4} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'staff' && staffAuthed && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">Staff</p>
                <h2 className="text-white text-base font-bold">{staffName}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={handleStaffLogout} className="text-white/30 hover:text-white/60 text-xs">
                <LogOut className="w-3 h-3 mr-1" /> Sign Out
              </Button>
            </div>

            {/* QR Scanner */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <QrCode className="w-3 h-3" /> QR / Camera Scanner
              </p>
              <QRCodeScanner onScanComplete={handleQRScan} darkMode={true} />
            </div>

            {/* Name Search */}
            <div className="relative">
              <Input
                value={staffSearchTerm}
                onChange={e => setStaffSearchTerm(e.target.value)}
                placeholder="Or search child by name (3+ chars)..."
                className="h-11 pl-9 text-sm bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            </div>

            {staffSearchResults.map(child => {
              const checked = alreadyIn(child.id);
              return (
                <button
                  key={child.id}
                  onClick={() => handleStaffCheckIn(child)}
                  disabled={checked || isLoading}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] ${
                    checked ? 'bg-emerald-500/[0.04] border-emerald-500/10 opacity-50' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${checked ? 'bg-emerald-500/15' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                    {checked ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <span className="text-white font-bold text-xs">{child.first_name[0]}{child.last_name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{child.first_name} {child.last_name}</h3>
                    {checked && <span className="text-emerald-400/50 text-[10px]">✓ Already in</span>}
                  </div>
                  {!checked && <UserCheck className="w-4 h-4 text-white/15" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ────── CHECK-OUT TAB ────── */}
        {activeTab === 'checkout' && (
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-white text-lg font-bold">Check Out</h2>
              <p className="text-white/25 text-xs">Search for a child to check them out</p>
            </div>

            <div className="relative">
              <Input
                value={checkoutSearch}
                onChange={e => setCheckoutSearch(e.target.value)}
                placeholder="Search checked-in children..."
                className="h-11 pl-9 text-sm bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            </div>

            {checkoutFilteredChildren.length === 0 ? (
              <div className="text-center py-8">
                <LogOut className="w-8 h-8 mx-auto text-white/10 mb-2" />
                <p className="text-white/25 text-xs">No children currently checked in</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">{checkoutFilteredChildren.length} currently checked in</p>
                {checkoutFilteredChildren.map((record: any) => (
                  <div key={record.id} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div className="w-10 h-10 bg-amber-500/15 rounded-lg flex items-center justify-center">
                      <span className="text-amber-400 font-bold text-xs">{record.child?.first_name?.[0]}{record.child?.last_name?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{record.child?.first_name} {record.child?.last_name}</h3>
                      <span className="text-white/20 text-[10px]">In since {new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCheckOut(record)}
                      disabled={isLoading}
                      className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-0 text-xs rounded-lg h-8 px-3"
                    >
                      <LogOut className="w-3 h-3 mr-1" /> Check Out
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Dialogs ═══ */}
      {selectedChild && (
        <ClassSelectionDialog
          open={showClassDialog}
          onClose={() => { setShowClassDialog(false); setSelectedChild(null); }}
          onConfirm={handleClassSelected}
          childName={`${selectedChild.first_name} ${selectedChild.last_name}`}
        />
      )}
      {selectedChild && (
        <NameTagPrintDialog
          open={showNameTagDialog}
          onClose={() => { setShowNameTagDialog(false); setSelectedChild(null); setCheckInQRData(''); setSelectedClassName(''); }}
          child={selectedChild}
          qrData={checkInQRData}
          className={selectedClassName}
        />
      )}
    </div>
  );
};

export default KioskCheckInSystem;
