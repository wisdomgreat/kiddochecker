
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, UserCheck, CheckCircle, AlertCircle, Maximize, Loader2,
  Info, MapPin, Shield, KeyRound, UserCog, LogIn, LogOut, QrCode,
  Camera, Baby, Phone, User, ArrowRight, Printer, Mail, Calendar, Clock,
} from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import { Globe, PenTool, Eraser } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignatureCanvas from 'react-signature-canvas';
import ClassSelectionDialog from './ClassSelectionDialog';
import NameTagPrintDialog from './NameTagPrintDialog';
import { useTranslation, Language } from '@/lib/i18n';
import { useLanguage } from '@/context/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  age?: number;
  allergies?: string;
}

interface GeoLocation { latitude: number; longitude: number; accuracy: number; }

type KioskTab = 'parent' | 'youth' | 'staff' | 'checkout';
const KioskCheckInSystem = () => {
  // ─── Core State ───
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
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
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');
  const [staffShifts, setStaffShifts] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // ─── Youth Self-Check ───
  const [youthLoginName, setYouthLoginName] = useState('');
  const [youthPinInput, setYouthPinInput] = useState('');
  const [youthAuthedChild, setYouthAuthedChild] = useState<Child | null>(null);
  const [youthLoginError, setYouthLoginError] = useState('');

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
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const phoneRef = useRef<HTMLInputElement>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { settings } = useSettings();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { sendCheckInNotification, sendCheckOutNotification } = useEmailNotifications();
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pendingCheckoutRecord, setPendingCheckoutRecord] = useState<any>(null);
  const signatureRef = useRef<any>(null);
  const [showNearbyDialog, setShowNearbyDialog] = useState(false);
  const [nearbyCenters, setNearbyCenters] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);


  // ─── Boot ───
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    loadTodayData();
    requestGeo();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data } = await (supabase
        .from('events') as any)
        .select('*')
        .eq('is_public', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);
      setUpcomingEvents(data || []);
    } catch { }
  };

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
      console.error("Kiosk data load error:", err);
      setTodayCount(0);
    }
  };

  useEffect(() => {
    let kioskId = (user as any)?.user_metadata?.device_id;
    if (!kioskId && settings?.kiosk_id) kioskId = settings.kiosk_id;

    const updateHeartbeat = async () => {
      if (!user?.id || userRole !== 'kiosk' || !kioskId) return;
      try {
        await supabase
          .from('enrolled_devices')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', kioskId);
      } catch (err) {
        console.error('[Kiosk] Heartbeat failed:', err);
      }
    };
    const interval = setInterval(updateHeartbeat, 1000 * 60 * 5);
    updateHeartbeat();
    return () => clearInterval(interval);
  }, [user, userRole, settings]);

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
    if (parentLoggedIn) {
      metadata.actor = `parent:${parentName}`;
    } else if (staffAuthed) {
      metadata.actor = `staff:${staffName}`;
    } else if (youthAuthedChild) {
      metadata.actor = `youth:${youthAuthedChild.first_name}`;
    } else {
      metadata.actor = 'system/anonymous';
    }
    try { await (supabase.from('device_activity_log' as any) as any).insert({ action, metadata }); } catch { }
  };

  const fetchNearbyCenters = async () => {
    if (!geoLocation) return;
    setIsLoadingNearby(true);
    try {
      const { data, error } = await supabase.rpc('get_nearest_centers', {
        p_lat: geoLocation.latitude,
        p_lng: geoLocation.longitude,
        p_limit: 5
      });
      if (!error) setNearbyCenters(data || []);
    } catch (err) {
      console.error("Error fetching nearby centers:", err);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (showNearbyDialog && geoLocation) {
      fetchNearbyCenters();
    }
  }, [showNearbyDialog, geoLocation]);

  const startAutoLogoutTimer = (seconds: number = 7) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => {
      handleGlobalLogout();
      toast({ title: "Auto Sign-Out", description: "You have been signed out for security." });
    }, seconds * 1000);
  };

  const handleGlobalLogout = () => {
    handleParentLogout();
    handleStaffLogout();
    handleYouthLogout();
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };

  // PARENT LOGIN
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
      const { data: kids } = await ((supabase.rpc as any)('get_children_for_kiosk', {
        p_parent_id: parent.id,
        p_pin: parentPin
      }) as any);
      setParentName(`${parent.first_name} ${parent.last_name}`);
      setParentChildren(kids || []);
      setParentLoggedIn(true);
      await logActivity('parent_login', { parent_id: parent.id, parent_name: parentName });
      startAutoLogoutTimer(60);
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
      toast({ title: t('alreadyCheckedIn'), description: t('childAlreadyCheckedIn', { childName: child.first_name }), variant: "destructive" });
      return;
    }
    setSelectedChild(child);
    setShowClassDialog(true);
  };

  // STAFF AUTH
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
        toast({ title: t('successMsg'), description: t('welcomeStaff', { staffName: staffMember.first_name }) });
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
    } catch (err) { console.error(err); }
    finally { setIsLoadingShifts(false); }
  };

  const handleShiftAction = async (shiftId: string, action: 'check_in' | 'check_out') => {
    setIsLoading(true);
    let kioskId = (user as any)?.user_metadata?.device_id;
    if (!kioskId && settings?.kiosk_id) kioskId = settings.kiosk_id;

    try {
      const { data, error } = await supabase.rpc('staff_shift_action_kiosk', {
        p_shift_id: shiftId,
        p_action: action,
        p_kiosk_id: kioskId
      });
      if (error) throw error;
      toast({ title: action === 'check_in' ? t('shiftCheckedIn') : t('shiftCheckedOut') });
      fetchStaffShifts();
    } catch (err: any) {
      toast({ title: t('loginError'), description: err.message, variant: "destructive" });
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

  // YOUTH AUTH
  const handleYouthLogin = async () => {
    if (youthPinInput.length < 4) {
      setYouthLoginError(t('loginError' as any));
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
        setYouthLoginError(result?.error || t('loginError' as any));
        toast({ title: "Auth Failed", description: result?.error || "Invalid PIN", variant: "destructive" });
      } else {
        const actionType = result.action; // 'checkin' or 'checkout'
        toast({ 
          title: actionType === 'checkin' ? "Welcome!" : "See you later!", 
          description: `${result.child_name} ${actionType === 'checkin' ? 'checked in' : 'checked out'} successfully.`, 
        });
        
        // Reset state
        setYouthPinInput('');
        setYouthLoginName('');
        startAutoLogoutTimer(5); // Fast logout after success
        loadTodayData(); // Refresh list
      }
    } catch (err: any) { setYouthLoginError(t('loginError' as any)); }
    finally { setIsLoading(false); }
  };


  const handleYouthLogout = () => {
    setYouthAuthedChild(null);
    setYouthLoginName('');
    setYouthPinInput('');
    setYouthLoginError('');
  };

  // Staff search
  useEffect(() => {
    if (!staffAuthed || staffSearchTerm.length < 2) { setStaffSearchResults([]); return; }
    const t = setTimeout(async () => {
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

  const handleQRScan = async (rawQRData: string) => {
    if (!staffAuthed) {
      toast({ title: "Staff PIN Required", description: "Please enter your staff PIN first.", variant: "destructive" });
      return;
    }
    const qrData = rawQRData.trim();
    setIsLoading(true);
    try {
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.type === 'CHECKOUT' && parsed.attendanceId) {
          const { data: att } = await supabase.from('attendance').select('*, child:children(*)').eq('id', parsed.attendanceId).maybeSingle();
          if (att) { handleCheckOut(att); return; }
        }
        const childId = parsed.id || parsed.child_id;
        if (childId && (parsed.type === 'CHILD_CHECKIN' || parsed.type === 'CHECKIN')) {
          if (checkedInChildIds.has(childId)) {
            const record = checkedInChildren.find((r: any) => r.child_id === childId);
            if (record) { handleCheckOut(record); return; }
          }
          const { data: child } = await supabase.from('children').select('*').eq('id', childId).single();
          if (child) { handleStaffCheckIn(child as any); return; }
        }

        if (parsed.type === 'FAMILY_CHECKIN' && parsed.parentId) {
           const { data: kids } = await supabase.from('children').select('*').eq('parent_id', parsed.parentId);
           if (kids && kids.length > 0) {
              setParentChildren(kids as any);
              setParentLoggedIn(true);
              setActiveTab('parent');
              toast({ title: "Family Identified", description: `Hi family! Please select who to check in/out.` });
              return;
           }
        }

      } catch { }

      if (qrData.toLowerCase().startsWith('child:')) {
        const parts = qrData.split(':');
        if (parts.length >= 2) {
          const childId = parts[1];
          if (checkedInChildIds.has(childId)) {
            const record = checkedInChildren.find((r: any) => r.child_id === childId);
            if (record) { handleCheckOut(record); return; }
          }
          const { data: child } = await supabase.from('children').select('*').eq('id', childId).single();
          if (child) { handleStaffCheckIn(child as any); return; }
        }
      }

      const { data: rec } = await supabase.from('qr_codes').select('*, child:children(*)').eq('qr_data', qrData).eq('is_active', true).maybeSingle();
      if (rec && rec.child) {
        if (checkedInChildIds.has(rec.child_id)) {
          const record = checkedInChildren.find((r: any) => r.child_id === rec.child_id);
          if (record) { handleCheckOut(record); return; }
        }
        handleStaffCheckIn(rec.child as any);
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrData)) {
        const { data: child } = await supabase.from('children').select('*').eq('id', qrData).single();
        if (child) {
          if (checkedInChildIds.has(child.id)) {
            const record = checkedInChildren.find((r: any) => r.child_id === child.id);
            if (record) { handleCheckOut(record); return; }
          }
          handleStaffCheckIn(child as any);
          return;
        }
      }
      toast({ title: t('invalidQR'), description: t('codeNotRecognized'), variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to process scan.", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const [currentSpecialInstructions, setCurrentSpecialInstructions] = useState('');

  const handleClassSelected = async (classId: string, specialInstructions: string = '') => {
    if (!selectedChild) return;
    setShowClassDialog(false);
    setIsLoading(true);
    try {
      const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single();
      let actorId = (await supabase.auth.getUser()).data.user?.id;
      if (parentLoggedIn && parentChildren.length > 0) actorId = parentChildren[0].parent_id;
      else if (youthAuthedChild) actorId = youthAuthedChild.id;

      const result = await AttendanceService.checkInChild({
        childId: selectedChild.id,
        classId,
        checkedInBy: actorId,
        method: youthAuthedChild ? 'youth_self' : 'kiosk',
        station: 'Main Kiosk',
        specialInstructions
      });

      if (result.success) {
        await logActivity('check_in', {
          child_id: selectedChild.id,
          child_name: `${selectedChild.first_name} ${selectedChild.last_name}`,
          class_name: classData?.name
        });
        const { data: qrCodeData } = await supabase.from('qr_codes').select('qr_data').eq('child_id', selectedChild.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
        const fallbackQR = JSON.stringify({ type: 'CHILD_CHECKIN', id: selectedChild.id, name: `${selectedChild.first_name} ${selectedChild.last_name}`, v: 1 });
        setCheckInQRData(qrCodeData?.qr_data || fallbackQR);
        setSelectedClassName(classData?.name || '');
        setCurrentSpecialInstructions(specialInstructions);
        setCheckedInChildIds(prev => new Set([...prev, selectedChild.id]));
        showSuccess(`${selectedChild.first_name} → ${classData?.name || 'class'}`);
        await loadTodayData();
        setShowNameTagDialog(true);
        startAutoLogoutTimer(7);
      } else {
        toast({ title: "Failed", description: result.error || "Could not check in", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Check-in failed", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    let baseList = checkedInChildren;
    if (parentLoggedIn) baseList = checkedInChildren.filter((r: any) => r.child?.parent_id === (parentChildren[0]?.parent_id || ''));
    else if (youthAuthedChild) baseList = checkedInChildren.filter((r: any) => r.child?.id === youthAuthedChild.id);
    else if (!staffAuthed) baseList = [];

    if (!checkoutSearch.trim()) { setCheckoutFilteredChildren(baseList); return; }
    const filtered = baseList.filter((r: any) => `${r.child?.first_name || ''} ${r.child?.last_name || ''}`.toLowerCase().includes(checkoutSearch.toLowerCase()));
    setCheckoutFilteredChildren(filtered);
  }, [checkoutSearch, checkedInChildren, parentLoggedIn, staffAuthed, youthAuthedChild, parentChildren]);

  const handleCheckOut = async (record: any, signatureData?: string) => {
    if (!record) return;
    setIsLoading(true);
    try {
      let actorId = (await supabase.auth.getUser()).data.user?.id;
      if (parentLoggedIn && parentChildren.length > 0) actorId = parentChildren[0].parent_id;
      else if (youthAuthedChild) actorId = youthAuthedChild.id;

      const result = await AttendanceService.checkOutChild({
        attendanceId: record.id,
        checkedOutBy: actorId,
        method: youthAuthedChild ? 'youth_self' : 'kiosk',
        station: 'Main Kiosk',
        signatureData: signatureData
      } as any);
      if (result.success) {
        await logActivity('check_out', { child_id: record.child_id, child_name: `${record.child?.first_name} ${record.child?.last_name}`, has_signature: !!signatureData });
        showSuccess(`${record.child?.first_name} checked out`);
        await loadTodayData();
        toast({ title: "✅ Checked Out", description: `${record.child?.first_name} ${record.child?.last_name}` });
        startAutoLogoutTimer(7);
        setPendingCheckoutRecord(null);
        setShowSignatureDialog(false);
      } else {
        toast({ title: "Failed", description: result.error || "Could not check out", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Checkout failed", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const initiateCheckOut = (record: any) => {
    if (!record) return;
    // Youth self-check might not need signature depending on settings, but we'll show it for all for now or check setting
    if (settings?.require_checkout_signature) {
       setPendingCheckoutRecord(record);
       setShowSignatureDialog(true);
    } else {
       handleCheckOut(record);
    }
  };


  const handleEmergencySignOut = async () => {
    if (!window.confirm(`Are you sure you want to sign out ALL ${checkedInChildren.length} children?`)) return;
    setIsLoading(true);
    for (const record of checkedInChildren) {
      await AttendanceService.checkOutChild({ attendanceId: record.id, checkedOutBy: (await supabase.auth.getUser()).data.user?.id, method: 'emergency_bulk' });
    }
    await loadTodayData();
    setIsLoading(false);
    toast({ title: "Bulk Sign-Out Complete" });
  };

  const alreadyIn = (id: string) => checkedInChildIds.has(id);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col overflow-hidden text-white antigravity-perspective font-sans">
      {/* Dynamic Background decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-50 flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3 text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse" />
          <span className="font-heading">{settings?.name || 'KiddoChecker'}</span>
          {geoLocation && <MapPin className="w-3 h-3 text-emerald-400/60" />}
        </div>
        <div className="flex items-center gap-6 text-white/60 text-[11px] font-black">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-white/60 hover:text-white hover:bg-white/10 uppercase tracking-widest border border-white/5 rounded-full px-4 transition-all">
                <Globe className="h-4 w-4" /> {language}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-white rounded-2xl shadow-2xl p-2">
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/20" onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/20" onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/20" onClick={() => setLanguage('es')}>Español</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/20" onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/20" onClick={() => setLanguage('it')}>Italiano</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-indigo-500/20" onClick={() => setLanguage('pt')}>Português</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
             <Badge className="bg-indigo-500/20 text-indigo-300 border-0 font-black px-2">{todayCount} LIVE</Badge>
             <span className="text-white font-black tracking-tighter text-sm">
               {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </span>
          </div>
          <button onClick={() => setShowNearbyDialog(true)} className="hover:scale-110 active:scale-95 transition-transform text-indigo-400"><MapPin className="w-4 h-4" /></button>
          <button onClick={toggleFs} className="hover:scale-110 active:scale-95 transition-transform"><Maximize className="w-4 h-4" /></button>
        </div>
      </div>

      {successMsg && (
        <div className="relative z-50 mx-6 mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 backdrop-blur-md animate-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-300 font-bold text-sm tracking-tight">{successMsg}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="relative z-50 px-6 pt-6 pb-4">
        <div className="flex bg-white/5 backdrop-blur-xl rounded-[2rem] p-1.5 border border-white/10 shadow-2xl overflow-hidden">
          {([
            { id: 'parent', label: t('parentAccess'), icon: KeyRound },
            { id: 'youth', label: t('youthCheckIn'), icon: User },
            { id: 'checkout', label: t('checkout'), icon: LogOut },
            { id: 'staff', label: t('staffAccess'), icon: UserCog },
          ] as { id: KioskTab, label: string, icon: any }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2.5 py-4 px-2 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 group relative ${activeTab === tab.id ? 'bg-indigo-600 shadow-[0_12px_24px_rgba(79,70,229,0.3)] text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
            >
              <tab.icon className={`w-5 h-5 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110 rotate-[-5deg]' : 'group-hover:scale-110'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar font-lexend">
        {activeTab === 'parent' && !parentLoggedIn && (
          <div className="max-w-sm mx-auto pt-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-2 font-heading">{t('parentPortal')}</h2>
              <div className="space-y-4">
                <div className="relative">
                  <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder={t('phoneNamePlaceholder')} className="h-12 pl-10 bg-white/5 border-white/10" autoFocus />
                  <Phone className="absolute left-3 top-4 w-4 h-4 text-white/20" />
                </div>
                <div className="relative">
                  <Input type="password" value={parentPin} onChange={e => setParentPin(e.target.value)} placeholder={t('pinPlaceholder')} className="h-12 pl-10 bg-white/5 border-white/10 tracking-[0.5em]" maxLength={8} />
                  <Shield className="absolute left-3 top-4 w-4 h-4 text-white/20" />
                </div>
                {parentLoginError && <p className="text-red-400 text-xs">{parentLoginError}</p>}
                <Button onClick={handleParentLogin} disabled={isLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 font-bold">{t('search')}</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parent' && parentLoggedIn && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{parentName}</h2>
              <Button variant="ghost" size="sm" onClick={handleParentLogout} className="text-white/30"><LogOut className="w-3 h-3 mr-1" /> {t('signOut')}</Button>
            </div>
            <div className="space-y-2">
              {parentChildren.map(child => {
                const checked = alreadyIn(child.id);
                return (
                  <button key={child.id} onClick={() => handleParentCheckIn(child)} disabled={checked} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${checked ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/5 border-white/10'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-600'}`}>
                      {checked ? <CheckCircle /> : child.first_name[0]}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold">{child.first_name} {child.last_name}</p>
                      <p className="text-[10px] text-white/40">{checked ? t('currentlyInSession') : t('readyCheckIn')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'youth' && (
          <div className="max-w-sm mx-auto pt-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-2">Youth Self-Check</h2>
              <p className="text-white/40 text-[10px] px-8 uppercase tracking-widest font-black">Individual PIN Access</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-amber-400 text-white/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter PIN Code"
                  value={youthPinInput}
                  onChange={(e) => setYouthPinInput(e.target.value)}
                  className="pl-12 h-14 bg-white/5 border-white/10 text-xl tracking-[0.5em] font-black focus:ring-amber-500/50 rounded-2xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleYouthLogin()}
                  autoFocus
                />
              </div>

              {youthLoginError && <p className="text-rose-400 text-center text-[10px] font-bold animate-shake">{youthLoginError}</p>}

              <Button
                onClick={handleYouthLogin}
                disabled={isLoading || youthPinInput.length < 4}
                className="w-full h-14 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Log"}
              </Button>
            </div>
          </div>
        )}

        {/* Similar logic for Staff and Checkout... I will keep the existing components for these */}
        {activeTab === 'staff' && (
           <div className="max-w-sm mx-auto pt-8">
              {!staffAuthed ? (
                <div className="space-y-4">
                  <Input type="password" value={staffPinInput} onChange={e => setStaffPinInput(e.target.value)} placeholder={t('staffPIN')} className="h-14 text-center text-2xl tracking-[0.5em]" />
                  <Button onClick={handleStaffAuth} className="w-full h-12 bg-indigo-600">{t('staffUnlock')}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <p className="font-bold text-sm">Staff: {staffName}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleStaffLogout} className="text-white/40 h-8 uppercase text-[10px] font-black tracking-widest">{t('signOut')}</Button>
                    </div>

                    <Tabs defaultValue="search" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl mb-4">
                        <TabsTrigger value="search" className="rounded-lg text-[10px] font-black uppercase tracking-widest">{t('search')}</TabsTrigger>
                        <TabsTrigger value="shifts" className="rounded-lg text-[10px] font-black uppercase tracking-widest">{t('staffShifts')}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="search" className="mt-0 space-y-4">
                        <QRCodeScanner onScanComplete={handleQRScan} darkMode={true} />
                        <Input value={staffSearchTerm} onChange={e => setStaffSearchTerm(e.target.value)} placeholder={t('staffSearchPlaceholder')} className="mt-4 bg-white/5 border-white/10" />
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {staffSearchResults.map(child => (
                            <Button key={child.id} variant="outline" className="w-full justify-start gap-4 h-16 bg-white/5 border-white/10 hover:bg-white/10 group rounded-2xl" onClick={() => handleStaffCheckIn(child)}>
                              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                <Baby className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                              </div>
                              <div className="text-left flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-sm">{child.first_name} {child.last_name}</p>
                                  {(child as any).has_active_background_check && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[8px] uppercase font-black px-1.5 py-0">Verified Staff</Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-white/40">Manual Override Check-In</p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="shifts" className="mt-0 space-y-4">
                        {isLoadingShifts ? (
                          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white/20" /></div>
                        ) : staffShifts.length > 0 ? (
                          <div className="space-y-3">
                            {staffShifts.map(shift => (
                              <div key={shift.shift_id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-sm">{shift.class_name || 'General Support'}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                                      {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                      {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-[8px] uppercase font-black">{shift.role_type}</Badge>
                                </div>

                                {!shift.actual_start_time ? (
                                  <Button onClick={() => handleShiftAction(shift.shift_id, 'check_in')} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold h-10 rounded-xl">
                                    {t('checkInShift')}
                                  </Button>
                                ) : !shift.actual_end_time ? (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-emerald-400 font-bold text-center">✓ {t('shiftCheckedIn')} ({new Date(shift.actual_start_time).toLocaleTimeString()})</p>
                                    <Button variant="outline" onClick={() => handleShiftAction(shift.shift_id, 'check_out')} className="w-full border-amber-600 text-amber-600 hover:bg-amber-600/10 font-bold h-10 rounded-xl">
                                      {t('checkOutShift')}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-center p-2 bg-emerald-500/10 rounded-xl">
                                    <p className="text-[10px] text-emerald-400 font-bold">✓ {t('shiftCheckedOut')} ({new Date(shift.actual_end_time).toLocaleTimeString()})</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Clock className="w-12 h-12 mx-auto text-white/10 mb-4" />
                            <p className="text-white/40 text-sm">{t('noShiftsToday')}</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                </div>
              )}
           </div>
        )}

        {activeTab === 'checkout' && (
          <div className="space-y-4 pt-4">
            {!(parentLoggedIn || staffAuthed || youthAuthedChild) ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-white/10 mb-4" />
                <p className="text-white/40">{t('scanPickUp')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Input value={checkoutSearch} onChange={e => setCheckoutSearch(e.target.value)} placeholder={t('search')} />
                {checkoutFilteredChildren.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <p className="font-bold">{record.child?.first_name}</p>
                      <p className="text-[10px] text-white/40">{record.class?.name}</p>
                    </div>
                    <Button size="sm" className="bg-amber-600" onClick={() => initiateCheckOut(record)}>{t('out')}</Button>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ClassSelectionDialog open={showClassDialog} onClose={() => setShowClassDialog(false)} onConfirm={handleClassSelected} childName={selectedChild?.first_name || ''} />
      {selectedChild && <NameTagPrintDialog open={showNameTagDialog} onClose={() => setShowNameTagDialog(false)} child={selectedChild} qrData={checkInQRData} className={selectedClassName} specialInstructions={currentSpecialInstructions} />}

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#0a0f25] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-400" />
              {t('signatureRequired' as any)}
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Please provide a signature to complete the checkout for {pendingCheckoutRecord?.child?.first_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-white rounded-xl p-1 overflow-hidden">
            <SignatureCanvas
              ref={signatureRef}
              penColor="black"
              canvasProps={{
                width: 380,
                height: 200,
                className: 'signature-canvas'
              }}
            />
          </div>
          <DialogFooter className="flex sm:justify-between gap-2 mt-4">
            <Button variant="ghost" onClick={() => signatureRef.current?.clear()} className="gap-2 text-white/40 hover:text-white">
              <Eraser className="w-4 h-4" /> Clear
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowSignatureDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={() => {
                const dataUrl = signatureRef.current?.getTrimmedCanvas().toDataURL('image/png');
                if (signatureRef.current?.isEmpty()) {
                  toast({ title: "Signature Empty", description: "Please provide a signature.", variant: "destructive" });
                  return;
                }
                handleCheckOut(pendingCheckoutRecord, dataUrl);
              }} className="bg-indigo-600 hover:bg-indigo-500 font-bold">
                Confirm Checkout
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nearby Centers Dialog */}
      <Dialog open={showNearbyDialog} onOpenChange={setShowNearbyDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#0a0f25] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase italic tracking-tight">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Nearby Centers
            </DialogTitle>
            <DialogDescription className="text-white/40 uppercase text-[10px] font-black tracking-widest">
              Find our partner locations in your area
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             {isLoadingNearby ? (
               <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" /></div>
             ) : (
               <div className="space-y-2">
                 {nearbyCenters.length === 0 ? (
                    <div className="text-center p-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-white/40 text-xs">No active centers detected nearby.</p>
                      <Button variant="link" onClick={fetchNearbyCenters} className="text-indigo-400 text-[10px] uppercase font-black">Retry Search</Button>
                    </div>
                 ) : nearbyCenters.map(center => (
                   <div key={center.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                     <div>
                       <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors">{center.name}</p>
                       <p className="text-[10px] text-white/40">{center.address}</p>
                     </div>
                     <Badge variant="outline" className="text-[8px] font-black">{center.distance_km || '?'} KM</Badge>
                   </div>
                 ))}
               </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNearbyDialog(false)} className="w-full border-white/10 rounded-xl text-white/40">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KioskCheckInSystem;

