
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  QrCode, Search, UserCheck, Users, CheckCircle, AlertCircle,
  Printer, Camera, Maximize, Loader2, Info, MapPin, Shield,
  ShieldCheck, KeyRound, UserCog,
} from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import ClassSelectionDialog from './ClassSelectionDialog';
import NameTagPrintDialog from './NameTagPrintDialog';
import PINDialog from './PINDialog';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  age?: number;
  allergies?: string;
}

type KioskView = 'search' | 'scan' | 'help';
type CheckInRole = 'parent' | 'staff';

interface GeoLocation { latitude: number; longitude: number; accuracy: number; }

const KioskCheckInSystem = () => {
  // ─── State ───
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showNameTagDialog, setShowNameTagDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkInQRData, setCheckInQRData] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [scannedQRToken, setScannedQRToken] = useState<string | null>(null);
  const [activePin, setActivePin] = useState('');
  const [activeView, setActiveView] = useState<KioskView>('search');
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [checkedInRole, setCheckedInRole] = useState<CheckInRole>('parent');
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [checkedInChildIds, setCheckedInChildIds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ─── Clock ───
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // ─── Boot ───
  useEffect(() => {
    loadTodayCount();
    requestGeo();
  }, []);

  // ─── Wake Lock ───
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

  const loadTodayCount = async () => {
    try {
      const data = await AttendanceService.getTodaysAttendance();
      setTodayCount(data.length);
      // Build set of already-checked-in child IDs
      const ids = new Set<string>();
      data.forEach((r: any) => { if (!r.checked_out_at) ids.add(r.child_id); });
      setCheckedInChildIds(ids);
    } catch { setTodayCount(0); }
  };

  // ─── Search (3 char minimum, no initial load) ───
  useEffect(() => {
    if (searchTerm.trim().length < 3) { setFilteredChildren([]); return; }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('children')
          .select('id, first_name, last_name, parent_id, age, allergies')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .limit(8);
        if (error) throw error;
        setFilteredChildren(data || []);
      } catch (err) { console.error('Search error:', err); }
      finally { setIsLoading(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ─── Check-In Flow ───
  const initiateCheckIn = (child: Child) => {
    // Block duplicate check-in
    if (checkedInChildIds.has(child.id)) {
      toast({ title: "Already Checked In", description: `${child.first_name} is already checked in today. Check out first before checking in again.`, variant: "destructive" });
      return;
    }
    setPendingChild(child);
    setShowRoleChoice(true);
  };

  const handleRoleSelected = async (role: CheckInRole) => {
    if (!pendingChild) return;
    setShowRoleChoice(false);
    setCheckedInRole(role);
    setIsLoading(true);

    try {
      if (role === 'parent') {
        // Fetch parent's personal PIN
        const { data } = await (supabase.from('profiles').select('security_pin').eq('id', pendingChild.parent_id).single() as any);
        if (data?.security_pin) {
          setActivePin(data.security_pin);
        } else {
          toast({ title: "No PIN Set", description: "This parent hasn't set a security PIN yet. Please ask a staff member for help.", variant: "destructive" });
          setPendingChild(null);
          setIsLoading(false);
          return;
        }
      } else {
        // Staff: use a special flow — staff enters their OWN PIN
        // We'll prompt for staff PIN. Staff must have set their PIN during onboarding.
        // For now we ask for any valid staff PIN from the profiles table
        // The PIN dialog will validate against the entered staff member's PIN
        setActivePin('STAFF_MODE');
      }
    } catch {
      toast({ title: "Error", description: "Could not load PIN data", variant: "destructive" });
      setPendingChild(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setShowPinDialog(true);
  };

  const handlePinSuccess = () => {
    setShowPinDialog(false);
    if (pendingChild) {
      setSelectedChild(pendingChild);
      setShowClassDialog(true);
      setPendingChild(null);
    }
  };

  const handleClassSelected = async (classId: string) => {
    if (!selectedChild) return;
    setShowClassDialog(false);
    setIsLoading(true);
    try {
      const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single();
      const result = await AttendanceService.checkInChild({
        childId: selectedChild.id, classId, checkedInBy: undefined, qrToken: scannedQRToken || undefined
      });

      if (result.success) {
        // Log geo
        if (geoLocation) {
          try {
            await (supabase.from('device_activity_log' as any) as any).insert({
              action: 'check_in',
              metadata: {
                child_id: selectedChild.id,
                child_name: `${selectedChild.first_name} ${selectedChild.last_name}`,
                class_name: classData?.name,
                checked_in_by: checkedInRole,
                lat: geoLocation.latitude, lon: geoLocation.longitude, acc: geoLocation.accuracy,
                ts: new Date().toISOString(),
              },
            });
          } catch {}
        }

        const { data: qrCodeData } = await supabase.from('qr_codes').select('qr_data').eq('child_id', selectedChild.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
        setCheckInQRData(qrCodeData?.qr_data || '');
        setSelectedClassName(classData?.name || '');
        setSuccessMsg(`${selectedChild.first_name} → ${classData?.name || 'class'}`);
        setTimeout(() => setSuccessMsg(''), 8000);

        // Update local set
        setCheckedInChildIds(prev => new Set([...prev, selectedChild.id]));
        await loadTodayCount();
        setSearchTerm('');
        setFilteredChildren([]);

        if (selectedChild.allergies) {
          toast({ title: "⚠️ ALLERGY ALERT", description: `${selectedChild.first_name}: ${selectedChild.allergies}`, variant: "destructive", duration: 10000 });
        }
        toast({ title: "✅ Check-in Successful!", description: `${selectedChild.first_name} ${selectedChild.last_name}` });
        setShowNameTagDialog(true);
      } else {
        // Handle "already checked in" from the database
        if (result.error?.includes('already checked in')) {
          setCheckedInChildIds(prev => new Set([...prev, selectedChild.id]));
          toast({ title: "Already Checked In", description: `${selectedChild.first_name} is already checked in today.`, variant: "destructive" });
        } else {
          toast({ title: "Check-in Failed", description: result.error || "Could not check in", variant: "destructive" });
        }
      }
    } catch (e: any) {
      if (e.message?.includes('already checked in')) {
        setCheckedInChildIds(prev => new Set([...prev, selectedChild!.id]));
        toast({ title: "Already Checked In", description: `${selectedChild.first_name} is already checked in.`, variant: "destructive" });
      } else {
        toast({ title: "Error", description: e.message || "An error occurred", variant: "destructive" });
      }
    } finally { setIsLoading(false); }
  };

  const handleQRScan = async (qrData: string) => {
    setIsLoading(true);
    try {
      const { data: rec, error } = await supabase.from('qr_codes').select('*, child:children(*)').eq('qr_data', qrData).eq('is_active', true).single();
      if (error || !rec) { toast({ title: "Invalid QR Code", description: "Not recognized or expired", variant: "destructive" }); return; }
      setScannedQRToken(qrData);
      setActiveView('search');
      initiateCheckIn(rec.child as any);
    } catch { toast({ title: "Error", description: "Failed to process QR code", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  // ─── PIN Dialog with staff mode ───
  const StaffPINDialog = () => {
    const [staffPin, setStaffPin] = useState('');
    const [staffError, setStaffError] = useState('');
    const [verifying, setVerifying] = useState(false);

    const verifyStaffPin = async () => {
      if (staffPin.length < 4) { setStaffError('PIN must be at least 4 digits'); return; }
      setVerifying(true);
      setStaffError('');
      try {
        // Look up any staff member with this PIN
        const { data, error } = await (supabase.from('profiles').select('id, first_name, last_name').eq('security_pin', staffPin) as any);
        if (error || !data || data.length === 0) {
          setStaffError('Invalid staff PIN. No staff member found with this PIN.');
          setStaffPin('');
        } else {
          toast({ title: "Staff Verified", description: `Authorized by ${data[0].first_name} ${data[0].last_name}` });
          handlePinSuccess();
        }
      } catch { setStaffError('Verification failed'); }
      finally { setVerifying(false); }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-3">
              <UserCog className="h-7 w-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Staff Authorization</h2>
            <p className="text-white/40 text-sm mt-1">Enter your personal staff PIN</p>
          </div>

          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter your PIN..."
            value={staffPin}
            onChange={e => { setStaffPin(e.target.value.replace(/\D/g, '')); setStaffError(''); }}
            onKeyDown={e => e.key === 'Enter' && verifyStaffPin()}
            className="h-14 text-center text-2xl tracking-[0.5em] bg-white/5 border-white/15 text-white rounded-xl"
            maxLength={8}
            autoFocus
          />

          {staffError && <p className="text-red-400 text-xs text-center">{staffError}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowPinDialog(false); setPendingChild(null); }} className="flex-1 border-white/10 text-white/50 hover:bg-white/5 rounded-xl">Cancel</Button>
            <Button onClick={verifyStaffPin} disabled={verifying || staffPin.length < 4} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Role Choice Dialog ───
  const RoleChoiceDialog = () => {
    if (!showRoleChoice || !pendingChild) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Who is checking in?</h2>
            <p className="text-white/40 text-sm mt-1">
              Checking in <span className="text-indigo-400 font-semibold">{pendingChild.first_name} {pendingChild.last_name}</span>
            </p>
          </div>

          <button
            onClick={() => handleRoleSelected('parent')}
            className="w-full flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/15 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold">I'm the Parent</p>
              <p className="text-white/40 text-xs">Enter your personal parent PIN</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelected('staff')}
            className="w-full flex items-center gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/15 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold">I'm a Staff Member</p>
              <p className="text-white/40 text-xs">Enter your personal staff PIN</p>
            </div>
          </button>

          <Button variant="ghost" onClick={() => { setShowRoleChoice(false); setPendingChild(null); }} className="w-full text-white/30 hover:text-white/50 text-xs">
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0e27] via-[#0d1333] to-[#0a0e27] flex flex-col select-none overflow-hidden">
      {/* ─── Status Bar ─── */}
      <div className="flex items-center justify-between px-5 py-2.5 text-white/50 text-[11px] font-medium shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wide">KIDDOCHECKER</span>
          {geoLocation && <MapPin className="w-2.5 h-2.5 text-emerald-400/50" />}
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums font-semibold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={toggleFs} className="p-1 hover:bg-white/5 rounded transition">
            <Maximize className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ─── Header ─── */}
      <div className="px-5 pt-2 pb-3 shrink-0">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">Check-In</h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-indigo-400/50 text-xs font-medium">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <Badge className="bg-emerald-500/10 text-emerald-400/70 border-emerald-500/15 text-[10px] px-2 py-0.5 font-semibold">
            {todayCount} checked in
          </Badge>
        </div>
      </div>

      {/* ─── Success Flash ─── */}
      {successMsg && (
        <div className="mx-5 mb-2 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl shrink-0 animate-in fade-in slide-in-from-top-1 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-300/80 text-xs font-medium truncate">{successMsg}</p>
        </div>
      )}

      {/* ─── View Switcher ─── */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.05]">
          {([
            { id: 'search' as KioskView, label: 'Search', icon: Search },
            { id: 'scan' as KioskView, label: 'QR Scan', icon: QrCode },
            { id: 'help' as KioskView, label: 'Help', icon: Info },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => { setActiveView(v.id); if (v.id === 'search') setTimeout(() => searchInputRef.current?.focus(), 150); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === v.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-white/30 hover:text-white/50'
              }`}
            >
              <v.icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* SEARCH */}
        {activeView === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Type child's name (min 3 letters)..."
                className="h-13 text-sm pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:bg-white/[0.08] focus:border-indigo-500/30"
                autoFocus
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              {isLoading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />}
            </div>

            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <p className="text-amber-400/50 text-[11px] flex items-center gap-1.5 px-1">
                <Shield className="w-3 h-3" /> Type at least 3 characters
              </p>
            )}

            {searchTerm.length >= 3 && filteredChildren.length === 0 && !isLoading && (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-white/10" />
                <p className="text-white/30 text-xs">No children found. Check spelling.</p>
              </div>
            )}

            {filteredChildren.map(child => {
              const alreadyIn = checkedInChildIds.has(child.id);
              return (
                <button
                  key={child.id}
                  onClick={() => initiateCheckIn(child)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 p-3.5 border rounded-xl active:scale-[0.98] transition-all text-left ${
                    alreadyIn
                      ? 'bg-emerald-500/[0.04] border-emerald-500/10 opacity-60'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-indigo-500/15'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                    alreadyIn ? 'bg-emerald-500/15' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/10'
                  }`}>
                    {alreadyIn ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <span className="text-white font-bold text-sm">{child.first_name[0]}{child.last_name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{child.first_name} {child.last_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {child.age && <span className="text-white/25 text-[11px]">Age {child.age}</span>}
                      {child.allergies && <Badge className="bg-red-500/10 text-red-400/70 border-red-500/15 text-[9px] px-1 py-0">⚠ Allergy</Badge>}
                      {alreadyIn && <span className="text-emerald-400/60 text-[10px] font-medium">✓ Checked in</span>}
                    </div>
                  </div>
                  {!alreadyIn && (
                    <div className="shrink-0 w-9 h-9 bg-white/[0.04] rounded-lg flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-emerald-400/60" />
                    </div>
                  )}
                </button>
              );
            })}

            {!searchTerm && (
              <div className="text-center pt-8 pb-4">
                <div className="w-16 h-16 mx-auto bg-white/[0.02] rounded-2xl flex items-center justify-center border border-dashed border-white/[0.06] mb-4">
                  <Search className="w-6 h-6 text-white/10" />
                </div>
                <p className="text-white/25 text-xs">Search for a child to begin</p>
                <p className="text-white/15 text-[10px] mt-1 flex items-center justify-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> PIN verification required for every check-in
                </p>
              </div>
            )}
          </div>
        )}

        {/* QR SCAN */}
        {activeView === 'scan' && (
          <div className="space-y-4 pt-2">
            <div className="text-center mb-4">
              <QrCode className="w-8 h-8 mx-auto text-indigo-400/40 mb-2" />
              <h3 className="text-white text-base font-bold">Scan QR Code</h3>
              <p className="text-white/25 text-[11px] mt-0.5">Start the camera or use a Bluetooth scanner below</p>
            </div>
            <QRCodeScanner onScanComplete={handleQRScan} darkMode={true} />
          </div>
        )}

        {/* HELP */}
        {activeView === 'help' && (
          <div className="space-y-2 pt-1">
            {[
              { icon: Shield, title: 'Security', body: 'Every check-in requires PIN verification. Parents use their PIN, staff use their own. Location & time are logged automatically.', c: 'emerald' },
              { icon: UserCheck, title: 'Check-In Steps', body: '1. Search child\'s name (3+ characters)\n2. Tap child → choose Parent or Staff\n3. Enter your PIN\n4. Select class → Print name tag', c: 'indigo' },
              { icon: QrCode, title: 'QR / Bluetooth Scanners', body: 'Connect any USB/Bluetooth scanner. Focus the search box and scan — it types and enters automatically.', c: 'indigo' },
              { icon: Printer, title: 'Label Printers', body: 'Install your label printer and set as default. After check-in, use the print dialog. Set paper size to match labels, margins to None.', c: 'indigo' },
              { icon: Camera, title: 'Camera Issues', body: 'Allow Camera Permissions in browser settings. HTTPS is required on mobile. Install as an app for best results.', c: 'amber' },
              { icon: Maximize, title: 'Install as App', body: 'Chrome: Menu → Install app\nSafari: Share → Add to Home Screen\nThis enables fullscreen, keeps screen on, and improves hardware access.', c: 'indigo' },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
                <h4 className="text-white/80 font-semibold text-[11px] mb-1 flex items-center gap-1.5">
                  <item.icon className={`w-3 h-3 text-${item.c}-400/60`} /> {item.title}
                </h4>
                <p className="text-white/30 text-[10px] leading-relaxed whitespace-pre-line">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Dialogs ─── */}
      <RoleChoiceDialog />

      {showPinDialog && activePin === 'STAFF_MODE' && <StaffPINDialog />}

      {showPinDialog && activePin !== 'STAFF_MODE' && (
        <PINDialog
          open={true}
          correctPin={activePin}
          onClose={() => { setShowPinDialog(false); setPendingChild(null); setActivePin(''); }}
          onSuccess={handlePinSuccess}
        />
      )}

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
          onClose={() => { setShowNameTagDialog(false); setSelectedChild(null); setCheckInQRData(''); setSelectedClassName(''); setScannedQRToken(null); }}
          child={selectedChild}
          qrData={checkInQRData}
          className={selectedClassName}
        />
      )}
    </div>
  );
};

export default KioskCheckInSystem;
