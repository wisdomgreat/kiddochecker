import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, CheckCircle, Maximize, Loader2,
  MapPin, Shield, KeyRound, UserCog, LogIn, LogOut, QrCode,
  Baby, Phone, User, Clock,
} from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import { Globe, PenTool, Eraser } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignatureCanvas from 'react-signature-canvas';
import ClassSelectionDialog from './ClassSelectionDialog';
import NameTagPrintDialog from './NameTagPrintDialog';
import { useTranslation } from '@/lib/i18n';
import { QRService } from '@/services/QRService';
import { useLanguage } from '@/context/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  age?: number;
  allergies?: string;
  class_id?: string;
}

interface GeoLocation { latitude: number; longitude: number; accuracy: number; }

type KioskTab = 'parent' | 'youth' | 'staff' | 'checkout';

const KioskCheckInSystem = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<KioskTab>('parent');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayCount, setTodayCount] = useState(0);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [parentLoggedIn, setParentLoggedIn] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentChildren, setParentChildren] = useState<Child[]>([]);
  const [parentLoginError, setParentLoginError] = useState('');
  const [checkedInChildIds, setCheckedInChildIds] = useState<Set<string>>(new Set());

  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<Child[]>([]);
  const [staffAuthed, setStaffAuthed] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');
  const [staffShifts, setStaffShifts] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  const [youthPinInput, setYouthPinInput] = useState('');
  const [youthLoginError, setYouthLoginError] = useState('');

  const [checkoutSearch, setCheckoutSearch] = useState('');
  const [checkedInChildren, setCheckedInChildren] = useState<any[]>([]);
  const [checkoutFilteredChildren, setCheckoutFilteredChildren] = useState<any[]>([]);

  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showNameTagDialog, setShowNameTagDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkInQRData, setCheckInQRData] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { settings } = useSettings();
  const { user, userRole } = useAuth();
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pendingCheckoutRecord, setPendingCheckoutRecord] = useState<any>(null);
  const signatureRef = useRef<any>(null);
  const [showParentScanner, setShowParentScanner] = useState(false);

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
    const req = async () => { try { if ('wakeLock' in navigator) wl = await (navigator as any).wakeLock.request('screen'); } catch { } };
    req();
    const vis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); if (wl) wl.release(); };
  }, []);

  const requestGeo = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        p => setGeoLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => { }, { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const toggleFs = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
    else document.exitFullscreen().catch(() => { });
  };

  const loadTodayData = async () => {
    try {
      const todayData = await AttendanceService.getTodaysAttendance();
      setTodayCount(todayData.length);
      const presentData = await AttendanceService.getCheckedInChildren();
      const ids = new Set<string>();
      presentData.forEach((r: any) => ids.add(r.child_id));
      setCheckedInChildIds(ids);
      setCheckedInChildren(presentData);
      setCheckoutFilteredChildren(presentData);
    } catch (err) {
      setTodayCount(0);
    }
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
    try { await (supabase.from('device_activity_log' as any) as any).insert({ action, metadata }); } catch { }
  };


  const startAutoLogoutTimer = (seconds: number = 7) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => {
      handleGlobalLogout();
    }, seconds * 1000);
  };

  const handleGlobalLogout = () => {
    handleParentLogout();
    handleStaffLogout();
    handleYouthLogout();
    window.localStorage.removeItem('kiosk_active_parent_id');
    window.localStorage.removeItem('kiosk_active_parent_name');
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };

  const handleParentLogin = async () => {
    if (!parentPhone.trim() || !parentPin.trim()) {
      setParentLoginError(t('loginError'));
      return;
    }
    setIsLoading(true);
    setParentLoginError('');
    try {
      const { data: matched, error } = await ((supabase.rpc as any)('get_parent_for_kiosk', {
        p_search_val: parentPhone.trim(),
        p_pin: parentPin
      }) as any);
      if (error || !matched || matched.length === 0) {
        setParentLoginError(t('loginError'));
        setIsLoading(false);
        return;
      }
      const parent = matched[0];
      let { data: kids } = await ((supabase.rpc as any)('get_children_for_kiosk', {
        p_parent_id: parent.id,
        p_pin: parentPin
      }) as any);

      if (!kids || kids.length === 0) {
        const { data: fallbackKids } = await supabase
          .from('children')
          .select('id, first_name, last_name, age, allergies, notes, parent_id')
          .eq('parent_id', parent.id);
        if (fallbackKids && fallbackKids.length > 0) kids = fallbackKids;
      }
      
      const kidsWithClasses = await Promise.all((kids || []).map(async (k: any) => {
        const { data: c } = await supabase.from('children').select('class_id').eq('id', k.id).maybeSingle();
        return { ...k, class_id: c?.class_id };
      }));
      
      setParentName(`${parent.first_name} ${parent.last_name}`);
      setParentChildren(kidsWithClasses || []);
      setParentLoggedIn(true);
      
      window.localStorage.setItem('kiosk_active_parent_id', parent.id);
      window.localStorage.setItem('kiosk_active_parent_name', `${parent.first_name} ${parent.last_name}`);

      await logActivity('parent_login', { parent_id: parent.id, parent_name: `${parent.first_name} ${parent.last_name}` });
      startAutoLogoutTimer(120);
    } catch (e: any) {
      setParentLoginError(e.message || t('loginError'));
    } finally { setIsLoading(false); }
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
      toast({ title: "Already In", description: `${child.first_name} is already checked in.`, variant: "destructive" });
      return;
    }
    setSelectedChild(child);
    setShowClassDialog(true);
  };

  const handleStaffAuth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await ((supabase.rpc as any)('verify_staff_pin_for_kiosk', { p_pin: staffPinInput }) as any);
      const staffMember = Array.isArray(data) ? data[0] : data;
      if (error || !staffMember) {
        setStaffPinError(t('loginError'));
        setStaffPinInput('');
      } else {
        setStaffAuthed(true);
        setStaffName(`${staffMember.first_name} ${staffMember.last_name}`);
        await logActivity('staff_login', { staff_id: staffMember.id, staff_name: staffName });
        fetchStaffShifts();
        startAutoLogoutTimer(2700);
      }
    } catch (err: any) { setStaffPinError(t('loginError')); }
    finally { setIsLoading(false); }
  };

  const fetchStaffShifts = async () => {
    setIsLoadingShifts(true);
    try {
      const { data, error } = await supabase.rpc('get_staff_shifts_for_kiosk', { p_pin: staffPinInput });
      if (!error) setStaffShifts(data || []);
    } catch (err) { }
    finally { setIsLoadingShifts(false); }
  };

  const handleShiftAction = async (shiftId: string, action: 'check_in' | 'check_out') => {
    setIsLoading(true);
    let kioskId = (user as any)?.user_metadata?.device_id || settings?.kiosk_id;

    try {
      const { error } = await supabase.rpc('staff_shift_action_kiosk', {
        p_shift_id: shiftId,
        p_action: action,
        p_kiosk_id: kioskId
      });
      if (error) throw error;
      toast({ title: action === 'check_in' ? "Shift Started" : "Shift Ended" });
      fetchStaffShifts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
       setIsLoading(false);
    }
  };

  const handleStaffLogout = () => {
    setStaffAuthed(false);
    setStaffName('');
    setStaffPinInput('');
    setStaffSearchTerm('');
    setStaffSearchResults([]);
    setStaffShifts([]);
  };

  const handleYouthLogin = async () => {
    if (youthPinInput.length < 4) {
      setYouthLoginError(t('loginError'));
      return;
    }
    setIsLoading(true);
    setYouthLoginError('');
    try {
      const { data: result, error } = await supabase.rpc('youth_self_check_action', {
        p_pin_code: youthPinInput,
        p_kiosk_id: settings?.id || 'manual'
      });

      if (error || !result.success) {
        setYouthLoginError(result?.error || t('loginError'));
      } else {
        const actionType = result.action;
        toast({ 
          title: "Success", 
          description: `${result.child_name} ${actionType === 'checkin' ? 'checked in' : 'checked out'}.`, 
        });
        setYouthPinInput('');
        startAutoLogoutTimer(5);
        loadTodayData();
      }
    } catch (err: any) { setYouthLoginError(t('loginError')); }
    finally { setIsLoading(false); }
  };


  const handleYouthLogout = () => {
    setYouthPinInput('');
    setYouthLoginError('');
  };

  useEffect(() => {
    if (!staffAuthed || staffSearchTerm.length < 2) { setStaffSearchResults([]); return; }
    const t_out = setTimeout(async () => {
      const cleaned = staffSearchTerm.trim();
      let query = supabase.from('children').select('*');
      if (cleaned.includes(' ')) {
        const parts = cleaned.split(' ').filter(p => p.length > 0);
        if (parts.length >= 2) query = query.ilike('first_name', `%${parts[0]}%`).ilike('last_name', `%${parts[1]}%`);
        else query = query.or(`first_name.ilike.%${cleaned}%,last_name.ilike.%${cleaned}%`);
      } else {
        query = query.or(`first_name.ilike.%${cleaned}%,last_name.ilike.%${cleaned}%`);
      }
      const { data } = await query.limit(8);
      setStaffSearchResults(data || []);
    }, 300);
    return () => clearTimeout(t_out);
  }, [staffSearchTerm, staffAuthed]);

  const handleStaffCheckIn = (child: Child) => {
    if (checkedInChildIds.has(child.id)) {
      toast({ title: "Already In", description: `${child.first_name} is already checked in.`, variant: "destructive" });
      return;
    }
    setSelectedChild(child);
    setShowClassDialog(true);
  };

  const handleQRScan = async (rawQRData: string) => {
    setIsLoading(true);
    try {
      const result = await QRService.parseAndVerify(rawQRData);
      if (result.type === 'error') {
        toast({ title: "Invalid QR", description: result.message, variant: "destructive" });
        return;
      }
      if (result.type === 'parent') {
        const { data: kids } = await supabase.from('children').select('*').eq('parent_id', result.id);
        if (kids && kids.length > 0) {
          setParentChildren(kids as any);
          setParentLoggedIn(true);
          setActiveTab('parent');
          toast({ title: "Hello", description: `Family identified. Select child to check in.` });
        }
        return;
      }
      if (result.type === 'child') {
        const { data: child } = await supabase.from('children').select('*, class_id').eq('id', result.id).maybeSingle();
        if (child) {
          if (checkedInChildIds.has(child.id)) {
            const record = checkedInChildren.find((r: any) => r.child_id === child.id);
            if (record) { handleCheckOut(record); return; }
          }
          handleStaffCheckIn(child as any);
        }
        return;
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Scan failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const [currentSpecialInstructions, setCurrentSpecialInstructions] = useState('');

  const handleClassSelected = async (classId: string, specialInstructions: string = '', hasFever: boolean = false, hasCough: boolean = false) => {
    if (!selectedChild) return;
    setShowClassDialog(false);
    setIsLoading(true);
    try {
      const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single();
      let actorId = (user as any)?.id;
      const storedParentId = window.localStorage.getItem('kiosk_active_parent_id');
      if (parentLoggedIn && storedParentId) actorId = storedParentId;

      const result = await AttendanceService.checkInChild({
        childId: selectedChild.id,
        classId,
        checkedInBy: actorId, 
        method: 'kiosk',
        station: 'Main Kiosk',
        specialInstructions,
        hasFever,
        hasCough
      });

      if (result.success) {
        await logActivity('check_in', {
          child_id: selectedChild.id,
          child_name: `${selectedChild.first_name} ${selectedChild.last_name}`
        });
        const { data: qrCodeData } = await supabase.from('qr_codes').select('qr_data').eq('child_id', selectedChild.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
        const fallbackQR = JSON.stringify({ type: 'CHILD_CHECKIN', id: selectedChild.id, name: `${selectedChild.first_name} ${selectedChild.last_name}`, v: 1 });
        setCheckInQRData(qrCodeData?.qr_data || fallbackQR);
        setSelectedClassName(classData?.name || '');
        setCurrentSpecialInstructions(specialInstructions);
        setCheckedInChildIds(prev => new Set([...prev, selectedChild.id]));
        await loadTodayData();
        setShowNameTagDialog(true);
        startAutoLogoutTimer(7);
      }
    } catch { }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    let baseList = checkedInChildren;
    if (parentLoggedIn) baseList = checkedInChildren.filter((r: any) => r.child?.parent_id === (parentChildren[0]?.parent_id || ''));
    else if (!staffAuthed) baseList = [];

    if (!checkoutSearch.trim()) { setCheckoutFilteredChildren(baseList); return; }
    const filtered = baseList.filter((r: any) => `${r.child?.first_name || ''} ${r.child?.last_name || ''}`.toLowerCase().includes(checkoutSearch.toLowerCase()));
    setCheckoutFilteredChildren(filtered);
  }, [checkoutSearch, checkedInChildren, parentLoggedIn, staffAuthed, parentChildren]);

  const handleCheckOut = async (record: any, signatureData?: string) => {
    if (!record) return;
    setIsLoading(true);
    try {
      let actorId = (await supabase.auth.getUser()).data.user?.id;
      if (parentLoggedIn && parentChildren.length > 0) actorId = parentChildren[0].parent_id;

      const result = await AttendanceService.checkOutChild({
        attendanceId: record.id,
        checkedOutBy: actorId,
        method: 'kiosk',
        station: 'Main Kiosk',
        signatureData: signatureData
      } as any);
      if (result.success) {
        await logActivity('check_out', { child_id: record.child_id });
        await loadTodayData();
        toast({ title: "Checked Out", description: `${record.child?.first_name} signed out.` });
        startAutoLogoutTimer(7);
        setPendingCheckoutRecord(null);
        setShowSignatureDialog(false);
      }
    } catch { }
    finally { setIsLoading(false); }
  };

  const initiateCheckOut = (record: any) => {
    if (!record) return;
    if (settings?.require_checkout_signature) {
       setPendingCheckoutRecord(record);
       setShowSignatureDialog(true);
    } else {
       handleCheckOut(record);
    }
  };

  const alreadyIn = (id: string) => checkedInChildIds.has(id);

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden text-foreground font-sans">
      
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 bg-card border-b shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-6 gap-1.5 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {settings?.name || 'KiddoChecker'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 uppercase tracking-tight text-[10px] font-bold">
                <Globe className="h-3.5 w-3.5" /> {language}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg">
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('es')}>Español</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-3 bg-muted px-3 py-1.5 rounded-xl text-xs font-bold">
             <span className="text-muted-foreground uppercase tracking-tight">{todayCount} Active</span>
             <span className="w-px h-3 bg-border" />
             <span className="text-foreground">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleFs} className="h-8 w-8"><Maximize className="h-4 w-4" /></Button>
        </div>
      </header>

      {successMsg && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5" />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <nav className="p-6">
        <div className="flex bg-card border rounded-2xl p-1.5 shadow-sm max-w-2xl mx-auto">
          {[
            { id: 'parent', label: t('parentAccess'), icon: KeyRound },
            { id: 'youth', label: t('youthCheckIn'), icon: User },
            { id: 'checkout', label: t('checkout'), icon: LogOut },
            { id: 'staff', label: t('staffAccess'), icon: UserCog },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as KioskTab)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto px-6 pb-12">
        <div className="max-w-xl mx-auto">
          {activeTab === 'parent' && !parentLoggedIn && (
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-slate-500" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Parent Verification</h2>
                  <p className="text-sm text-muted-foreground">Sign in with phone or scan QR profile</p>
                </div>

                <div className="space-y-4 pt-2">
                  {showParentScanner ? (
                    <div className="space-y-4">
                      <div className="aspect-square rounded-2xl overflow-hidden border bg-muted">
                        <QRCodeScanner onScanComplete={(data) => {
                           handleQRScan(data);
                           setShowParentScanner(false);
                        }} />
                      </div>
                      <Button variant="ghost" onClick={() => setShowParentScanner(false)} className="w-full text-xs font-bold uppercase tracking-wider">Cancel Scan</Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowParentScanner(true)} 
                      className="w-full h-24 flex flex-col gap-2 rounded-2xl border-dashed border-2 hover:bg-muted/50"
                    >
                      <QrCode className="h-6 w-6 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Scan Family QR Code</span>
                    </Button>
                  )}
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="Phone Number" className="h-10 pl-10" />
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" value={parentPin} onChange={e => setParentPin(e.target.value)} placeholder="Direct PIN" className="h-10 pl-10" maxLength={8} />
                    </div>
                    {parentLoginError && <p className="text-destructive text-xs font-bold text-center">{parentLoginError}</p>}
                    <Button onClick={handleParentLogin} disabled={isLoading} className="w-full h-10 font-bold uppercase tracking-wide">Identification Search</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'parent' && parentLoggedIn && (
            <div className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Family Account</p>
                  <h2 className="text-xl font-bold">{parentName}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={handleParentLogout} className="text-xs h-8"><LogOut className="w-3 h-3 mr-1.5" /> Sign Out</Button>
              </div>
              <div className="space-y-3">
                {parentChildren.map(child => {
                  const checked = alreadyIn(child.id);
                  return (
                    <Card key={child.id} className={cn("overflow-hidden cursor-pointer hover:border-primary/50 transition-all rounded-2xl shadow-sm", checked && "bg-muted/30 border-primary/20 opacity-80")}>
                        <CardContent className="p-5" onClick={() => handleParentCheckIn(child)}>
                            <div className="flex items-center gap-5">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all shadow-inner", checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                    {checked ? <CheckCircle className="w-7 h-7" /> : child.first_name[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-base">{child.first_name} {child.last_name}</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                        {checked ? "Already in session" : "Available for check-in"}
                                    </p>
                                </div>
                                {!checked && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                            </div>
                        </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'youth' && (
            <Card className="shadow-sm rounded-3xl overflow-hidden border">
                <CardContent className="p-10 space-y-8">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Youth Self-Check</h2>
                        <p className="text-sm text-muted-foreground">Enter security PIN to log entry/exit</p>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="Security PIN"
                                value={youthPinInput}
                                onChange={(e) => setYouthPinInput(e.target.value)}
                                className="pl-12 h-12 text-2xl tracking-[0.4em] font-bold"
                            />
                        </div>
                        {youthLoginError && <p className="text-destructive text-center text-xs font-bold">{youthLoginError}</p>}
                        <Button
                            onClick={handleYouthLogin}
                            disabled={isLoading || youthPinInput.length < 4}
                            className="w-full h-12 font-bold uppercase"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
          )}

          {activeTab === 'staff' && (
             <div className="space-y-6">
                {!staffAuthed ? (
                  <Card className="shadow-sm rounded-3xl">
                    <CardContent className="p-10 space-y-6">
                        <div className="text-center space-y-2 mb-6">
                            <h2 className="text-2xl font-bold">Staff Access</h2>
                            <p className="text-sm text-muted-foreground">Identification PIN required</p>
                        </div>
                        <Input type="password" value={staffPinInput} onChange={e => setStaffPinInput(e.target.value)} placeholder="0000" className="h-16 text-center text-3xl tracking-[0.6em] font-bold rounded-2xl bg-muted border-none shadow-inner" />
                        <Button onClick={handleStaffAuth} className="w-full h-14 font-bold uppercase text-base tracking-wider rounded-2xl">Unlock Station</Button>
                        {staffPinError && <p className="text-destructive text-center text-xs font-bold uppercase tracking-tight">{staffPinError}</p>}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center bg-card p-5 border rounded-2xl shadow-sm">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Authenticated Staff</p>
                          <p className="font-bold text-lg">{staffName}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleStaffLogout} className="text-xs h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive">Sign Out</Button>
                      </div>
>

                      <Tabs defaultValue="search" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="search">Children</TabsTrigger>
                          <TabsTrigger value="shifts">Shifts</TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                          <Card className="p-4 bg-muted/20 border-dashed">
                             <QRCodeScanner onScanComplete={handleQRScan} />
                          </Card>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input value={staffSearchTerm} onChange={e => setStaffSearchTerm(e.target.value)} placeholder="Manual search..." className="pl-10" />
                          </div>
                          <div className="grid gap-2">
                            {staffSearchResults.map(child => (
                              <Card key={child.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleStaffCheckIn(child)}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center font-bold">{child.first_name[0]}</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{child.first_name} {child.last_name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Check-In Override</p>
                                    </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="shifts" className="space-y-3">
                          {isLoadingShifts ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                          ) : staffShifts.length > 0 ? (
                            staffShifts.map(shift => (
                              <Card key={shift.shift_id} className="overflow-hidden">
                                <CardContent className="p-4 space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-sm">{shift.class_name || 'General Support'}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-bold uppercase">{shift.role_type}</Badge>
                                  </div>

                                  {!shift.actual_start_time ? (
                                    <Button onClick={() => handleShiftAction(shift.shift_id, 'check_in')} className="w-full font-bold h-9">
                                      Start Shift
                                    </Button>
                                  ) : !shift.actual_end_time ? (
                                    <div className="space-y-2">
                                      <p className="text-[10px] text-emerald-600 font-bold text-center">Active: {new Date(shift.actual_start_time).toLocaleTimeString()}</p>
                                      <Button variant="outline" onClick={() => handleShiftAction(shift.shift_id, 'check_out')} className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 h-9 font-bold">
                                        End Shift
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="text-center p-2 bg-emerald-50 rounded-md">
                                      <p className="text-[10px] text-emerald-600 font-bold">Completed at {new Date(shift.actual_end_time).toLocaleTimeString()}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <p className="text-sm">No shifts found for today.</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'checkout' && (
            <div className="space-y-6">
              {!(parentLoggedIn || staffAuthed) ? (
                <Card className="p-12 text-center text-muted-foreground border-dashed">
                    <Shield className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-tight">Security ID Required</p>
                    <p className="text-xs pt-1">Please identify as Parent or Staff first</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={checkoutSearch} onChange={e => setCheckoutSearch(e.target.value)} placeholder="Filter children..." className="pl-10" />
                  </div>
                  <div className="grid gap-2">
                    {checkoutFilteredChildren.map(record => (
                      <Card key={record.id} className="shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border bg-slate-50 flex items-center justify-center font-bold">
                                    {record.child?.first_name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{record.child?.first_name} {record.child?.last_name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{record.class?.name}</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => initiateCheckOut(record)} className="font-bold uppercase text-[10px] h-8 px-4">Log Exit</Button>
                        </CardContent>
                      </Card>
                    ))}
                    {checkoutFilteredChildren.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            <p className="text-sm font-bold uppercase">No records found</p>
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ClassSelectionDialog 
        open={showClassDialog} 
        onClose={() => setShowClassDialog(false)} 
        onConfirm={handleClassSelected} 
        childName={selectedChild?.first_name || ''} 
        initialClassId={selectedChild?.class_id}
      />
      
      {selectedChild && (
        <NameTagPrintDialog 
            open={showNameTagDialog} 
            onClose={() => setShowNameTagDialog(false)} 
            child={selectedChild} 
            qrData={checkInQRData} 
            className={selectedClassName} 
            specialInstructions={currentSpecialInstructions} 
        />
      )}

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-muted/50 border-b">
            <DialogTitle>Verification Required</DialogTitle>
            <DialogDescription>Please provide a signature for {pendingCheckoutRecord?.child?.first_name}.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
              <div className="border bg-card rounded-md p-1 overflow-hidden">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{ width: 400, height: 200, className: 'w-full h-[200px]' }}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button variant="ghost" size="sm" onClick={() => signatureRef.current?.clear()} className="gap-2 text-muted-foreground">
                  <Eraser className="w-4 h-4" /> Reset
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSignatureDialog(false)}>Abort</Button>
                  <Button size="sm" onClick={() => {
                    const dataUrl = signatureRef.current?.getTrimmedCanvas().toDataURL('image/png');
                    if (signatureRef.current?.isEmpty()) {
                      toast({ title: "Incomplete", description: "Signature is required.", variant: "destructive" });
                      return;
                    }
                    handleCheckOut(pendingCheckoutRecord, dataUrl);
                  }}>Authorize Exit</Button>
                </div>
              </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default KioskCheckInSystem;

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

