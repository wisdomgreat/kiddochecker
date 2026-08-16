import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, CheckCircle, Maximize, Loader2,
  MapPin, Shield, KeyRound, UserCog, LogIn, LogOut, QrCode,
  Baby, Phone, User, Clock, ArrowRight, Eraser, Globe, PenTool, Smartphone, ShieldAlert, Printer
} from 'lucide-react';
import { PrintService } from '@/services/printService';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { apiFetch } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import { useNFC } from '@/hooks/useNFC';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
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
import { AttendanceRecord } from '@/types/attendance';

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
  const isEs = language === 'es';
  const [activeOrgId, setActiveOrgId] = useState<string>(() => window.localStorage.getItem('kiosk_active_org_id') || '00000000-0000-0000-0000-000000000001');
  const [organizations, setOrganizations] = useState<any[]>([
    { id: '00000000-0000-0000-0000-000000000001', name: 'English Congregation', slug: 'english', language_code: 'en' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Spanish Congregation', slug: 'spanish', language_code: 'es' },
    { id: 'all', name: 'Combined Service / Servicio Combinado', slug: 'combined', language_code: 'es' }
  ]);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { data, error } = await supabase.from('organizations').select('*');
        if (!error && data && data.length > 0) {
          setOrganizations(data);
          const currentValid = data.some(o => o.id === activeOrgId);
          if (!currentValid) {
            setActiveOrgId(data[0].id);
            window.localStorage.setItem('kiosk_active_org_id', data[0].id);
            setLanguage(data[0].language_code || 'en');
          }
        }
      } catch (err) {
        console.warn('Failed to load organizations from database:', err);
      }
    };
    fetchOrgs();
  }, []);

  const [activeTab, setActiveTab] = useState<KioskTab>('parent');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayCount, setTodayCount] = useState(0);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStaffKeyboard, setShowStaffKeyboard] = useState(false);
  const [securityBlockedIp, setSecurityBlockedIp] = useState<string | null>(null);

  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [printServerIp, setPrintServerIp] = useState(() => localStorage.getItem('kiddochecker_print_server_url') || '');
  const [targetPrinterIp, setTargetPrinterIp] = useState(() => localStorage.getItem('kiddochecker_target_printer_ip') || '');
  const [targetPrinterName, setTargetPrinterName] = useState(() => localStorage.getItem('kiddochecker_target_printer_name') || '');
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);

  const testPrinterConnection = async () => {
    if (!printServerIp.trim()) {
      toast({ title: "IP Required", description: "Please enter your Print Server PC IP.", variant: "destructive" });
      return;
    }
    setIsTestingPrinter(true);
    let target = printServerIp.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `http://${target}`;
    }
    if (!target.includes(':3003') && !target.endsWith('/health')) {
      target = `${target}:3003/health`;
    } else if (!target.endsWith('/health')) {
      target = `${target}/health`;
    }

    try {
      const res = await fetch(target, { method: 'GET' });
      if (res.ok) {
        toast({ title: "Print Server Online! ✅", description: `Connected to Print Server at ${target}` });
      } else {
        toast({ title: "Server Warning", description: `Received status ${res.status}`, variant: "destructive" });
      }
    } catch (err: any) {
      toast({
        title: "Connection Failed ❌",
        description: `Could not reach ${target}. Ensure print server is running on port 3003.`,
        variant: "destructive"
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const savePrinterSettings = () => {
    localStorage.setItem('kiddochecker_print_server_url', printServerIp.trim());
    localStorage.setItem('kiddochecker_target_printer_ip', targetPrinterIp.trim());
    localStorage.setItem('kiddochecker_target_printer_name', targetPrinterName.trim());
    setShowPrinterDialog(false);
    toast({ title: "Printer Saved 🖨️", description: "Kiosk printer configuration updated." });
  };

  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [parentLoggedIn, setParentLoggedIn] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentProfileId, setParentProfileId] = useState<string | null>(null);
  const [parentChildren, setParentChildren] = useState<Child[]>([]);
  const [parentLoginError, setParentLoginError] = useState('');
  const [activeInput, setActiveInput] = useState<'phone' | 'pin'>('phone');

  const formatPhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleKeypadChange = (val: string) => {
    if (activeInput === 'phone') {
      const cleaned = val.replace(/\D/g, '');
      if (cleaned.length <= 10) setParentPhone(formatPhoneNumber(cleaned));
      if (cleaned.length === 10) setActiveInput('pin');
    } else {
      setParentPin(val);
    }
  };
  const [checkedInChildIds, setCheckedInChildIds] = useState<Set<string>>(new Set());

  const [staffAuthed, setStaffAuthed] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [canManageKiosk, setCanManageKiosk] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<Child[]>([]);
  const [staffShifts, setStaffShifts] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isRegisteringNFC, setIsRegisteringNFC] = useState<string | null>(null);

  const canAccessKioskSettings = staffAuthed && (
    staffRole === 'admin' || 
    staffRole === 'super_admin' || 
    canManageKiosk === true
  );

  const [youthPinInput, setYouthPinInput] = useState('');
  const [youthLoginError, setYouthLoginError] = useState('');

  const [checkoutSearch, setCheckoutSearch] = useState('');
  const [checkedInChildren, setCheckedInChildren] = useState<AttendanceRecord[]>([]);
  const [checkoutFilteredChildren, setCheckoutFilteredChildren] = useState<AttendanceRecord[]>([]);

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
  }, [activeOrgId]);

  useEffect(() => {
    requestGeo();
    restoreSession();
  }, []);

  const restoreSession = async () => {
    const savedId = window.localStorage.getItem('kiosk_active_parent_id');
    const savedName = window.localStorage.getItem('kiosk_active_parent_name');
    if (savedId && savedName && !parentLoggedIn) {
      console.log('[Kiosk] Attempting session restoration for:', savedName);
      setIsLoading(true);
      try {
        // CRITICAL (Azure): Validate via Azure API that the cached parent ID still
        // has an active user_roles entry. Deleted accounts have no user_roles row.
        // We use apiFetch (Azure Container App) — NOT Supabase directly.
        const validateRes = await apiFetch('/api/query', {
          method: 'POST',
          body: JSON.stringify({
            table: 'user_roles',
            select: 'role',
            filters: [
              { column: 'user_id', value: savedId, operator: '=' },
              { column: 'role', value: 'parent', operator: '=' },
              { operator: 'maybeSingle' }
            ]
          })
        });

        const roleCheck = validateRes?.data;
        if (!roleCheck) {
          console.log('[Kiosk] Session invalidated: parent account no longer active. Clearing cache.');
          window.localStorage.removeItem('kiosk_active_parent_id');
          window.localStorage.removeItem('kiosk_active_parent_name');
          setIsLoading(false);
          return;
        }

        // Fetch children via Azure API
        const { data: kids, error } = await supabase
          .from('children')
          .select('id, first_name, last_name, age, allergies, notes, parent_id, class_id')
          .eq('parent_id', savedId)
          .eq('organization_id', activeOrgId);

        if (!error && kids && kids.length > 0) {
          setParentName(savedName);
          setParentProfileId(savedId);
          setParentChildren(kids as any);
          setParentLoggedIn(true);
          console.log('[Kiosk] Session restored successfully.');
        } else {
          // No children found — clear stale session
          window.localStorage.removeItem('kiosk_active_parent_id');
          window.localStorage.removeItem('kiosk_active_parent_name');
        }
      } catch (err) {
        console.error('[Kiosk] Session restoration failed:', err);
        window.localStorage.removeItem('kiosk_active_parent_id');
        window.localStorage.removeItem('kiosk_active_parent_name');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ─── NFC Integration ──────────────────────────────────────────────────────
  const { isSupported: nfcSupported, startScanning: startNfc } = useNFC((serial) => {
    console.log('[Kiosk] NFC Tag detected:', serial);
    if (isRegisteringNFC) {
      handleNfcRegister(serial);
    } else {
      handleNfcLogin(serial);
    }
  });

  // Start NFC scanning automatically for Kiosk
  useEffect(() => {
    if (nfcSupported) {
      console.log("[Kiosk] Auto-starting NFC reader...");
      startNfc();
    }
  }, [nfcSupported, startNfc, isRegisteringNFC]);

  // Auto-Fullscreen on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          console.warn("Fullscreen request denied or not supported.");
        });
      }
      // Remove listeners after first interaction
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('mousedown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const handleNfcRegister = async (serial: string) => {
    if (!isRegisteringNFC) return;
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ nfc_uid: serial })
        .eq('id', isRegisteringNFC);

      if (error) throw error;

      toast({ title: "Tag Linked", description: "Successfully linked NFC tag to this account." });
      setIsRegisteringNFC(null);
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNfcLogin = async (serial: string) => {
    try {
      setIsLoading(true);
      // Search for user with this NFC tag
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('nfc_uid', serial)
        .maybeSingle();

      if (error || !data) {
        toast({ title: "NFC Tag Unrecognized", description: "This tag is not linked to any account.", variant: "destructive" });
        return;
      }

      // Query user_roles table for ultimate role assignment correctness
      const { data: roleRes } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.id)
        .maybeSingle();

      const userRole = roleRes?.role || data.role || 'parent';

      // Handle login based on resolved role type
      if (userRole === 'parent') {
        setParentPhone(data.phone || '');
        setParentName(`${data.first_name} ${data.last_name}`);
        setParentProfileId(data.id);

        const kids = await supabase.from('children').select('*').eq('parent_id', data.id).eq('organization_id', activeOrgId);
        const kidsWithClasses = await Promise.all(((kids.data) || []).map(async (k: any) => {
          const { data: c } = await supabase.from('children').select('class_id').eq('id', k.id).maybeSingle();
          return { ...k, class_id: c?.class_id };
        }));

        setParentChildren(kidsWithClasses || []);
        setParentLoggedIn(true);
        setActiveTab('parent');

        window.localStorage.setItem('kiosk_active_parent_id', data.id);
        window.localStorage.setItem('kiosk_active_parent_name', `${data.first_name} ${data.last_name}`);

        await logActivity('parent_login', { parent_id: data.id, parent_name: `${data.first_name} ${data.last_name}` });
        startAutoLogoutTimer(120);
        showSuccess(`Welcome back, ${data.first_name}!`);
      } else if (['staff', 'teacher', 'admin', 'super_admin'].includes(userRole)) {
        setStaffAuthed(true);
        setStaffName(`${data.first_name} ${data.last_name}`);
        setActiveTab('staff');
        await logActivity('staff_login', { staff_id: data.id, staff_name: `${data.first_name} ${data.last_name}` });
        fetchStaffShifts();
        startAutoLogoutTimer(2700);
        showSuccess(`Staff access granted: ${data.first_name}`);
      }
    } catch (err: any) {
      console.error('[NFC] Login failed:', err);
      const errMsg = err.message || '';
      if (errMsg.includes('ACCESS_DENIED')) {
        const ipMatch = errMsg.match(/IP address\s+([^\s\.]+)/);
        const ip = ipMatch ? ipMatch[1] : 'External IP';
        setSecurityBlockedIp(ip);
      }
    } finally {
      setIsLoading(false);
    }
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
      const todayData = await AttendanceService.getTodaysAttendance(activeOrgId);
      setTodayCount(todayData.length);
      const presentData = await AttendanceService.getCheckedInChildren(activeOrgId);
      const ids = new Set<string>();
      presentData.forEach((r) => ids.add(r.child_id));
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

  /**
   * Helper for retrying RPC calls in flaky kiosk environments
   */
  async function safeRPC<T = any>(fnName: string, params: any, retries = 2): Promise<{ data: T | null; error: any }> {
    let lastError: any = null;
    for (let i = 0; i <= retries; i++) {
      try {
        console.log(`[Kiosk] RPC ${fnName} (Attempt ${i + 1}/${retries + 1})`);
        const result = await supabase.rpc(fnName, params);
        if (!result.error) return result as any;
        lastError = result.error;
        // Only retry on network/timeout errors, not logic/auth errors
        if (result.error.message?.includes('fetch') || result.error.message?.includes('timeout')) {
          await new Promise(r => setTimeout(r, 500 * (i + 1))); // Exponential backoff
          continue;
        }
        return result as any; 
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || '';
        if (errMsg.includes('ACCESS_DENIED')) {
          const ipMatch = errMsg.match(/IP address\s+([^\s\.]+)/);
          const ip = ipMatch ? ipMatch[1] : 'External IP';
          setSecurityBlockedIp(ip);
          return { data: null, error: err };
        }
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
      }
    }
    return { data: null, error: lastError };
  }

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
    const cleanPhone = parentPhone.replace(/\D/g, '');
    try {
      const { data: matched, error } = await safeRPC('get_parent_for_kiosk', {
        p_search_val: cleanPhone || parentPhone.trim(),
        p_pin: parentPin.trim(),
        p_org_id: activeOrgId
      });

      if (error || !matched || (matched as any).length === 0) {
        console.error('[Kiosk] Parent search failed:', error);
        setParentLoginError(t('loginError'));
        setIsLoading(false);
        return;
      }

      const parent = (matched as any)[0];
      let { data: kids, error: kidsError } = await safeRPC('get_children_for_kiosk', {
        p_parent_id: parent.id,
        p_pin: parentPin,
        p_org_id: activeOrgId
      });

      if (kidsError) console.warn('[Kiosk] get_children_for_kiosk error:', kidsError);

      if (!kids || (kids as any).length === 0) {
        const { data: fallbackKids } = await supabase
          .from('children')
          .select('id, first_name, last_name, age, allergies, notes, parent_id')
          .eq('parent_id', parent.id)
          .eq('organization_id', activeOrgId);
        if (fallbackKids && fallbackKids.length > 0) kids = fallbackKids;
      }
      
      const kidsWithClasses = await Promise.all(((kids as any) || []).map(async (k: any) => {
        const { data: c } = await supabase.from('children').select('class_id').eq('id', k.id).maybeSingle();
        return { ...k, class_id: c?.class_id };
      }));
      
      setParentName(`${parent.first_name} ${parent.last_name}`);
      setParentProfileId(parent.id);
      setParentChildren(kidsWithClasses || []);
      setParentLoggedIn(true);
      
      window.localStorage.setItem('kiosk_active_parent_id', parent.id);
      window.localStorage.setItem('kiosk_active_parent_name', `${parent.first_name} ${parent.last_name}`);

      await logActivity('parent_login', { parent_id: parent.id, parent_name: `${parent.first_name} ${parent.last_name}` });
      startAutoLogoutTimer(120);
    } catch (e: any) {
      console.error('[Kiosk] handleParentLogin exception:', e);
      setParentLoginError(e.message || t('loginError'));
    } finally { setIsLoading(false); }
  };

  const handleQRScan = async (scannedData: string) => {
    console.log('[Kiosk] Scanned QR Code Data:', scannedData);
    if (!scannedData || !scannedData.trim()) return;

    setIsLoading(true);
    setParentLoginError('');

    try {
      let targetId = '';
      let targetPhone = '';

      const trimmed = scannedData.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          targetId = parsed.parentId || parsed.id || parsed.user_id || '';
          targetPhone = parsed.phone || '';
        } catch (e) { }
      } else if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
        targetId = trimmed;
      } else {
        targetPhone = trimmed;
      }

      let profileData: any = null;
      if (targetId) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        profileData = data;
      } else if (targetPhone) {
        const cleanPhone = targetPhone.replace(/\D/g, '');
        const { data } = await supabase.from('profiles').select('*').eq('phone', cleanPhone).maybeSingle();
        profileData = data;
      }

      if (!profileData) {
        toast({ title: "QR Scan Unrecognized", description: "No registered account matched this QR code.", variant: "destructive" });
        return;
      }

      // Fetch children for this parent
      let { data: kids } = await supabase
        .from('children')
        .select('id, first_name, last_name, age, allergies, notes, parent_id, class_id')
        .eq('parent_id', profileData.id)
        .eq('organization_id', activeOrgId);

      setParentName(`${profileData.first_name || ''} ${profileData.last_name || ''}`);
      setParentProfileId(profileData.id);
      setParentChildren(kids || []);
      setParentLoggedIn(true);

      window.localStorage.setItem('kiosk_active_parent_id', profileData.id);
      window.localStorage.setItem('kiosk_active_parent_name', `${profileData.first_name} ${profileData.last_name}`);

      await logActivity('parent_qr_login', { parent_id: profileData.id, parent_name: `${profileData.first_name} ${profileData.last_name}` });
      startAutoLogoutTimer(120);
      showSuccess(`Welcome back, ${profileData.first_name}!`);
    } catch (err: any) {
      console.error('[Kiosk] QR login exception:', err);
      toast({ title: "QR Login Failed", description: err.message || "Failed to process QR code", variant: "destructive" });
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
      const record = checkedInChildren.find(r => r.child_id === child.id && !r.checked_out_at);
      if (record) {
        initiateCheckOut(record);
      } else {
        toast({ title: "Already In", description: `${child.first_name} is already checked in.`, variant: "destructive" });
      }
      return;
    }

    // Smart Check: Prevent duplicate check-in within a 2-hour window
    const recentCheckIn = checkedInChildren.find(r => 
      r.child_id === child.id && 
      r.checked_out_at && 
      (new Date().getTime() - new Date(r.checked_out_at).getTime()) < (2 * 60 * 60 * 1000)
    );

    if (recentCheckIn) {
      toast({ 
        title: "Recently Checked Out", 
        description: `${child.first_name} was checked out less than 2 hours ago. This service is likely already completed.`, 
        variant: "destructive" 
      });
      return;
    }

    setSelectedChild(child);
    setShowClassDialog(true);
  };

  const handleStaffAuth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await safeRPC('verify_staff_pin_for_kiosk', { p_pin: staffPinInput });
      const staffMember = Array.isArray(data) ? data[0] : data;
      if (error || !staffMember) {
        console.error('[Kiosk] Staff verification failed:', error);
        setStaffPinError(t('loginError'));
        setStaffPinInput('');
      } else {
        setStaffAuthed(true);
        setStaffName(`${staffMember.first_name} ${staffMember.last_name}`);
        setStaffRole(staffMember.role || 'staff');
        setCanManageKiosk(Boolean(staffMember.can_manage_kiosk || staffMember.role === 'admin' || staffMember.role === 'super_admin'));
        await logActivity('staff_login', { staff_id: staffMember.id, staff_name: `${staffMember.first_name} ${staffMember.last_name}` });
        fetchStaffShifts();
        startAutoLogoutTimer(2700);
      }
    } catch (err: any) { 
      console.error('[Kiosk] handleStaffAuth exception:', err);
      setStaffPinError(t('loginError')); 
    }
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
    setStaffRole('');
    setCanManageKiosk(false);
    setStaffSearchTerm('');
    setStaffSearchResults([]);
    setStaffPinInput('');
    setStaffPinError('');
  };

  const handleYouthLogin = async () => {
    if (youthPinInput.length < 4) {
      setYouthLoginError(t('loginError'));
      return;
    }
    setIsLoading(true);
    setYouthLoginError('');
    try {
      const { data: result, error } = await safeRPC('youth_self_check_action', {
        p_pin_code: youthPinInput,
        p_kiosk_id: settings?.id || 'manual'
      });

      if (error || !(result as any).success) {
        console.error('[Kiosk] Youth self check failed:', error);
        setYouthLoginError((result as any)?.error || t('loginError'));
      } else {
        const actionType = (result as any).action;
        toast({ 
          title: "Success", 
          description: `${(result as any).child_name} ${actionType === 'checkin' ? 'checked in' : 'checked out'}.`, 
        });
        setYouthPinInput('');
        startAutoLogoutTimer(5);
        loadTodayData();
      }
    } catch (err: any) { 
      console.error('[Kiosk] handleYouthLogin exception:', err);
      setYouthLoginError(t('loginError')); 
    }
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
      let query = supabase.from('children').select('*').eq('organization_id', activeOrgId);
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
  }, [staffSearchTerm, staffAuthed, activeOrgId]);

  const handleStaffCheckIn = (child: Child) => {
    if (checkedInChildIds.has(child.id)) {
      toast({ title: "Already In", description: `${child.first_name} is already checked in.`, variant: "destructive" });
      return;
    }

    // Smart Check: 2-hour window
    const recentCheckIn = checkedInChildren.find(r => 
      r.child_id === child.id && 
      r.checked_out_at && 
      (new Date().getTime() - new Date(r.checked_out_at).getTime()) < (2 * 60 * 60 * 1000)
    );

    if (recentCheckIn) {
      toast({ 
        title: "Duplicate Check-in Blocked", 
        description: `${child.first_name} was checked out recently.`, 
        variant: "destructive" 
      });
      return;
    }

    setSelectedChild(child);
    setShowClassDialog(true);
  };

  const handleDirectQRScan = async (rawQRData: string) => {
    setIsLoading(true);
    try {
      const result = await QRService.parseAndVerify(rawQRData);
      if (result.type === 'error') {
        toast({ title: "Invalid QR", description: result.message, variant: "destructive" });
        return;
      }
      if (result.type === 'parent') {
        const { data: kids } = await supabase.from('children').select('*').eq('parent_id', result.id).eq('organization_id', activeOrgId);
        if (kids && kids.length > 0) {
          setParentChildren(kids as any);
          setParentLoggedIn(true);
          setActiveTab('parent');
          toast({ title: "Hello", description: `Family identified. Select child to check in.` });
        }
        return;
      }
      if (result.type === 'child') {
        const { data: child } = await supabase.from('children').select('*, class_id').eq('id', result.id).eq('organization_id', activeOrgId).maybeSingle();
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
      if (parentLoggedIn) actorId = parentProfileId || window.localStorage.getItem('kiosk_active_parent_id') || actorId;

      const result = await AttendanceService.checkInChild({
        childId: selectedChild.id,
        classId,
        checkedInBy: actorId, 
        method: 'kiosk',
        station: 'Main Kiosk',
        specialInstructions,
        hasFever,
        hasCough,
        deviceId: (user as any)?.user_metadata?.device_id,
        orgId: activeOrgId
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
    console.log(`[Kiosk] Filter Run | parentLoggedIn: ${parentLoggedIn} | Total Records: ${checkedInChildren.length}`);
    let baseList = checkedInChildren;
    
    if (parentLoggedIn) {
      const myChildIds = new Set(parentChildren.map(c => c.id));
      baseList = checkedInChildren.filter((r) => myChildIds.has(r.child_id));
    } else if (!staffAuthed) {
      baseList = [];
    }

    if (!checkoutSearch.trim()) { 
      setCheckoutFilteredChildren(baseList); 
      return; 
    }
    const filtered = baseList.filter((r) => `${r.child?.first_name || ''} ${r.child?.last_name || ''}`.toLowerCase().includes(checkoutSearch.toLowerCase()));
    setCheckoutFilteredChildren(filtered);
  }, [checkoutSearch, checkedInChildren, parentLoggedIn, staffAuthed, parentChildren]);

  const handleCheckOut = async (record: AttendanceRecord, signatureData?: string) => {
    if (!record) return;
    setIsLoading(true);
    try {
      let actorId = (await supabase.auth.getUser()).data.user?.id;
      if (parentLoggedIn) actorId = parentProfileId || parentChildren[0]?.parent_id || actorId;

      const result = await AttendanceService.checkOutChild({
        attendanceId: record.id,
        checkedOutBy: actorId,
        method: 'kiosk',
        station: 'Main Kiosk',
        signatureData: signatureData,
        pickupSnapshot: parentLoggedIn ? parentChildren : undefined,
        deviceId: (user as any)?.user_metadata?.device_id
      } as any);
      if (result.success) {
        await logActivity('check_out', { child_id: record.child_id });
        
        // Optimistic update for immediate feedback
        setCheckedInChildren(prev => prev.filter(r => r.id !== record.id));
        setCheckedInChildIds(prev => {
          const next = new Set(prev);
          next.delete(record.child_id);
          return next;
        });

        await loadTodayData();
        toast({ title: "Checked Out", description: `${record.child?.first_name} signed out.` });
        
        // Success feedback
        showSuccess(`${record.child?.first_name} has been checked out successfully.`);
        
        // Clear session and return to mode selection after 3 seconds
        setTimeout(() => {
          setParentLoggedIn(false);
          setParentChildren([]);
          setCheckoutFilteredChildren([]);
          setActiveTab('parent'); // Default back to parent tab
        }, 3000);

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
    <div className="fixed inset-0 h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col select-none font-sans">
      
      {/* ─── Ultra-Compact Top Bar (Height: 42px) [Circled Area 1 Optimized] ─── */}
      <header className="h-[42px] min-h-[42px] max-h-[42px] z-50 flex items-center justify-between px-3 sm:px-5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl shadow-sm">
        {/* Left: Organization Branding & Live Status (Single Line, No Awkward Wrapping) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs font-black tracking-wide whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{settings?.name || 'Green Valley Alliance'}</span>
          </div>

          {nfcSupported ? (
            <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[9px] font-bold border-emerald-500/40 text-emerald-400 bg-emerald-950/40 hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              NFC Active
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[9px] font-bold border-slate-800 text-slate-400 bg-slate-900 hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              NFC Ready
            </Badge>
          )}
        </div>
        
        {/* Center: Congregation / Language Switcher (Compact Rounded Pill) */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-full border border-slate-800 shadow-inner">
          {organizations.map((org) => {
            const isActive = activeOrgId === org.id;
            return (
              <button
                key={org.id}
                onClick={() => {
                  if (activeOrgId !== org.id) {
                    setActiveOrgId(org.id);
                    window.localStorage.setItem('kiosk_active_org_id', org.id);
                    setLanguage(org.language_code || 'en');
                    handleGlobalLogout();
                    toast({
                      title: `Switched to ${org.name}`,
                      description: `Enforcing strict boundary isolation. All active sessions cleared.`,
                    });
                  }
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {org.slug === 'english' ? '🇬🇧 EN' : org.slug === 'spanish' ? '🇪🇸 ES' : org.slug === 'combined' ? '🤝 Combined' : org.name}
              </button>
            );
          })}
        </div>

        {/* Right: Real-time Stats & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
            <span className="text-emerald-400 uppercase tracking-tight">{checkedInChildren.length} In</span>
            <span className="w-px h-2.5 bg-slate-800" />
            <span className="text-slate-400 uppercase tracking-tight">{todayCount} Total</span>
            <span className="w-px h-2.5 bg-slate-800" />
            <span className="text-slate-200 font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] font-bold uppercase text-slate-300 hover:text-white hover:bg-slate-800">
                <Globe className="h-3 w-3 mr-0.5" /> {language}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
              <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-slate-800">English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')} className="hover:bg-slate-800">Français</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('es')} className="hover:bg-slate-800">Español</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {canAccessKioskSettings && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPrinterDialog(true)} 
              className="h-6 px-2 text-[9px] font-bold gap-1 border-blue-500/30 text-blue-400 bg-blue-950/20 hover:bg-blue-900/30"
              title="Printer Setup"
            >
              <Printer className="h-3 w-3" />
              <span className="hidden md:inline">Printer</span>
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleFs} className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800">
            <Maximize className="h-3 w-3" />
          </Button>
        </div>
      </header>

      {/* ─── Sleek Horizontal Navigation Tabs (Height: 38px) [Circled Area 2 Optimized] ─── */}
      <nav className="h-[38px] min-h-[38px] max-h-[38px] px-3 sm:px-5 bg-slate-900/50 border-b border-slate-800/50 flex items-center justify-center">
        <div className="flex bg-slate-950/90 border border-slate-800/80 rounded-xl p-0.5 shadow-inner max-w-xl w-full">
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
                "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-950" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              )}
            >
              <tab.icon className="w-3 h-3" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Compact Zero-Scroll Main Workspace [Circled Areas 3 & 4 Optimized] ─── */}
      <main className="flex-1 overflow-hidden p-2 sm:p-3 lg:p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl h-full max-h-[560px] flex flex-col justify-center">
          
          {/* ══════════════════════════════════════════════════════════════
              PARENT CHECK-IN TAB (Unauthenticated)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'parent' && !parentLoggedIn && (
            <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
              
              {/* Left Column: QR Fast Pass, NFC & Instructions (5 Cols) */}
              <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
                <div>
                  {/* [Circled Area 3 Optimized: Low-Profile Compact Header without oversized icon] */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black tracking-tight text-white">
                        {isEs ? "Verificación Familiar" : "Parent Verification"}
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        {isEs ? "Escanee QR o use su teléfono/PIN" : "Scan QR pass or enter phone/PIN"}
                      </p>
                    </div>
                  </div>

                  {/* [Circled Area 4 Optimized: Sleek Scanner Area replacing huge 96px empty grey box] */}
                  <div className="mt-2">
                    {showParentScanner ? (
                      <div className="space-y-1.5">
                        <div className="h-40 rounded-xl overflow-hidden border border-blue-500/40 bg-black/60 shadow-inner flex items-center justify-center">
                          <QRCodeScanner onScanComplete={(data) => {
                             handleQRScan(data);
                             setShowParentScanner(false);
                          }} />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowParentScanner(false)} 
                          className="w-full h-6 text-[9px] font-bold uppercase text-slate-400 hover:text-white"
                        >
                          {isEs ? "Cerrar Escáner" : "Close Scanner"}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowParentScanner(true)}
                        className="w-full h-28 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/50 hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 group-hover:border-blue-500 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-200 group-hover:text-blue-300">
                            {isEs ? "Escanear Pase Familiar" : "Scan Family QR Pass"}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {isEs ? "Toque para abrir la cámara" : "Tap to activate camera"}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* NFC Tap Card */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                      {isEs ? "Lector NFC Activo" : "NFC Reader Active"}
                    </p>
                    <p className="text-[10px] text-slate-300 font-medium">
                      {isEs ? "Acerque su pulsera o teléfono" : "Tap wristband or smart tag"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Mode Display & Compact Touch Keypad (7 Cols) */}
              <div className="md:col-span-7 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
                
                {/* Mode Selector & Display Box */}
                <div>
                  <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 mb-2">
                    <button
                      onClick={() => setActiveInput('phone')}
                      className={cn(
                        "flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        activeInput === 'phone'
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <Phone className="w-3 h-3 inline mr-1" />
                      {isEs ? "Teléfono" : "Phone Number"}
                    </button>
                    <button
                      onClick={() => setActiveInput('pin')}
                      className={cn(
                        "flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        activeInput === 'pin'
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <Shield className="w-3 h-3 inline mr-1" />
                      {isEs ? "PIN Directo" : "Direct PIN"}
                    </button>
                  </div>

                  {/* High-Definition Input Display */}
                  <div className="h-10 rounded-xl bg-slate-950 border border-slate-800 px-3.5 flex items-center justify-between shadow-inner">
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      {activeInput === 'phone' ? 'Phone:' : 'PIN:'}
                    </span>
                    <span className="text-lg font-mono font-black tracking-widest text-blue-300">
                      {activeInput === 'phone' 
                        ? (parentPhone || <span className="text-slate-600 text-sm">(000) 000-0000</span>)
                        : (parentPin ? '•'.repeat(parentPin.length) : <span className="text-slate-600 text-sm">••••</span>)
                      }
                    </span>
                    <button 
                      onClick={() => {
                        if (activeInput === 'phone') setParentPhone('');
                        else setParentPin('');
                      }} 
                      className="text-[9px] font-bold uppercase text-slate-500 hover:text-rose-400 px-1 py-0.5 rounded"
                    >
                      Clear
                    </button>
                  </div>

                  {parentLoginError && (
                    <p className="text-rose-400 text-[11px] font-bold text-center mt-1 animate-in fade-in">
                      {parentLoginError}
                    </p>
                  )}
                </div>

                {/* Compact Ergonomic Touch Keypad */}
                <div className="my-1">
                  <NumericKeypad 
                    value={activeInput === 'phone' ? parentPhone.replace(/\D/g, '') : parentPin} 
                    onChange={handleKeypadChange} 
                    maxLength={activeInput === 'phone' ? 10 : 8}
                  />
                </div>

                {/* Primary Action Button */}
                <Button 
                  onClick={handleParentLogin} 
                  disabled={isLoading || (activeInput === 'phone' ? parentPhone.replace(/\D/g, '').length < 7 : parentPin.length < 4)}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-950 active:scale-[0.98] transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isEs ? "Continuar con Check-In" : "Lookup & Check In"}
                </Button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PARENT CHECK-IN (Authenticated Children Roster)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'parent' && parentLoggedIn && (
            <div className="h-full flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400">
                    {isEs ? "Cuenta Familiar Verificada" : "Verified Family Account"}
                  </p>
                  <h2 className="text-base font-black text-white">{parentName}</h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[11px] font-bold border-emerald-500/30 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 rounded-xl"
                    onClick={() => {
                      const parentId = window.localStorage.getItem('kiosk_active_parent_id');
                      if (parentId) {
                        setIsRegisteringNFC(parentId);
                        startNfc();
                        toast({ 
                          title: isEs ? "Listo para NFC" : "Ready for NFC", 
                          description: isEs ? "Por favor acerque su tarjeta o teléfono al lector." : "Please tap your physical tag or phone against the reader now." 
                        });
                      }
                    }}
                  >
                    <Smartphone className="w-3 h-3 mr-1" />
                    {isRegisteringNFC === window.localStorage.getItem('kiosk_active_parent_id') 
                      ? (isEs ? "Esperando..." : "Waiting...") 
                      : (isEs ? "Vincular NFC" : "Link NFC Tag")}
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleParentLogout} 
                    className="h-7 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                  >
                    <LogOut className="w-3 h-3 mr-1 text-rose-400" /> 
                    {isEs ? "Cerrar" : "Sign Out"}
                  </Button>
                </div>
              </div>

              {/* Children Cards Grid (Zero-Scroll Responsive Grid) */}
              <div className="flex-1 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto max-h-[380px]">
                {parentChildren.map(child => {
                  const checked = alreadyIn(child.id);
                  return (
                    <div 
                      key={child.id} 
                      onClick={() => handleParentCheckIn(child)}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
                        checked 
                          ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30" 
                          : "bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:bg-slate-900/90 shadow-md"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-inner",
                          checked ? "bg-rose-600 text-white" : "bg-blue-600 text-white"
                        )}>
                          {checked ? <CheckCircle className="w-5 h-5" /> : child.first_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-xs text-white truncate">{child.first_name} {child.last_name}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                            {child.age ? `Age ${child.age}` : 'Registered Child'}
                          </p>
                          {child.allergies && (
                            <span className="inline-block mt-0.5 px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[8px] font-black uppercase text-amber-300">
                              ⚠️ {child.allergies}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className={cn(
                          "text-[9px] font-extrabold uppercase tracking-wider",
                          checked ? "text-rose-400" : "text-emerald-400"
                        )}>
                          {checked ? (isEs ? "● Presente" : "● Checked In") : (isEs ? "○ Disponible" : "○ Ready")}
                        </span>
                        <div className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1",
                          checked ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                        )}>
                          {checked ? (
                            <>
                              <LogOut className="w-2.5 h-2.5" />
                              <span>{isEs ? "Salida" : "Check Out"}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>{isEs ? "Entrada" : "Check In"}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Instructions / Done Bar */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">
                  {isEs ? "Toque un niño para registrar entrada o salida" : "Tap any child card above to check in or out"}
                </p>
                <Button 
                  size="sm" 
                  onClick={handleParentLogout} 
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-md"
                >
                  {isEs ? "Listo / Finalizar" : "Done / Complete"}
                </Button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              YOUTH SELF-CHECK TAB
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'youth' && (
            <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
              
              {/* Left Column: Instructions */}
              <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                    <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-black tracking-tight text-white">
                    {isEs ? "Autoregistro de Jóvenes" : "Youth Self-Check"}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {isEs 
                      ? "Ingrese su PIN personal de seguridad de 4 a 6 dígitos para registrar su entrada o salida del campamento." 
                      : "Enter your personal 4 to 6 digit security PIN to log your attendance entry or exit."}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-blue-400 tracking-wider mb-0.5">
                    {isEs ? "Aviso de Seguridad" : "Security Notice"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isEs ? "Las asistencias se registran en tiempo real con sello de hora." : "All check-ins and exits are timestamped in real-time."}
                  </p>
                </div>
              </div>

              {/* Right Column: Keypad & Verification */}
              <div className="md:col-span-7 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
                <div>
                  <div className="h-10 rounded-xl bg-slate-950 border border-slate-800 px-3.5 flex items-center justify-between shadow-inner">
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      PIN:
                    </span>
                    <span className="text-xl font-mono font-black tracking-widest text-blue-300">
                      {youthPinInput ? '•'.repeat(youthPinInput.length) : <span className="text-slate-600 text-sm">••••</span>}
                    </span>
                    <button 
                      onClick={() => setYouthPinInput('')} 
                      className="text-[9px] font-bold uppercase text-slate-500 hover:text-rose-400"
                    >
                      Clear
                    </button>
                  </div>

                  {youthLoginError && (
                    <p className="text-rose-400 text-[11px] font-bold text-center mt-1 animate-in fade-in">
                      {youthLoginError}
                    </p>
                  )}
                </div>

                <div className="my-1">
                  <NumericKeypad 
                    value={youthPinInput} 
                    onChange={setYouthPinInput} 
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={handleYouthLogin} 
                  disabled={isLoading || youthPinInput.length < 4}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-950 active:scale-[0.98] transition-all"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ArrowRight className="w-3.5 h-3.5 mr-1.5" />}
                  {isEs ? "Verificar Identidad" : "Verify & Check In"}
                </Button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              CHECKOUT TAB
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'checkout' && (
            <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
              {!(parentLoggedIn || staffAuthed) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                      {isEs ? "Autorización de Seguridad Requerida" : "Security Verification Required"}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      {isEs 
                        ? "Por favor inicie sesión como Padre en la pestaña 'Padres' o como Personal para autorizar la salida." 
                        : "Please identify via the 'Parent Access' or 'Staff Terminal' tab first to authorize child checkout."}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setActiveTab('parent')} 
                    className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    {isEs ? "Ir a Verificación Familiar" : "Go to Family Verification"}
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <Input 
                        value={checkoutSearch} 
                        onChange={e => setCheckoutSearch(e.target.value)} 
                        placeholder={isEs ? "Filtrar por nombre..." : "Filter present children..."} 
                        className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs text-white rounded-xl" 
                      />
                    </div>
                    <Badge variant="outline" className="h-7 text-xs font-bold border-emerald-500/40 text-emerald-400 bg-emerald-950/30">
                      {checkoutFilteredChildren.length} Present
                    </Badge>
                  </div>

                  <div className="flex-1 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[440px]">
                    {checkoutFilteredChildren.map(record => (
                      <div key={record.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300">
                            {record.child?.first_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs text-white truncate">{record.child?.first_name} {record.child?.last_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{record.class?.name || 'Classroom'}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => initiateCheckOut(record)} 
                          className="h-8 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg"
                        >
                          <LogOut className="w-3 h-3 mr-1" />
                          {isEs ? "Salida" : "Log Exit"}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isEs ? "Las salidas se auditan con firma y confirmación de tutor autorizado." : "All checkouts are logged with authorized guardian verification."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STAFF TERMINAL TAB
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'staff' && (
            <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
              {!staffAuthed ? (
                <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                        <UserCog className="w-6 h-6" />
                      </div>
                      <h2 className="text-lg font-black tracking-tight text-white">
                        {isEs ? "Acceso de Personal" : "Staff Terminal"}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {isEs 
                          ? "Ingrese su PIN de personal para desbloquear la estación, registrar turnos y gestionar niños." 
                          : "Enter authorized staff PIN to unlock station controls, manage shifts, and perform override check-ins."}
                      </p>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowStaffKeyboard(!showStaffKeyboard)}
                      className="text-[10px] font-bold uppercase text-slate-400 hover:text-white"
                    >
                      <PenTool className="h-3 w-3 mr-1.5" />
                      {showStaffKeyboard ? "Switch to Touch Keypad" : "Switch to Keyboard Input"}
                    </Button>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div>
                      <div className="h-12 rounded-xl bg-slate-950 border border-slate-800 px-4 flex items-center justify-between shadow-inner">
                        <span className="text-xs font-bold uppercase text-slate-500">Staff PIN:</span>
                        <span className="text-2xl font-mono font-black tracking-widest text-blue-300">
                          {staffPinInput ? '•'.repeat(staffPinInput.length) : <span className="text-slate-600">••••</span>}
                        </span>
                        <button onClick={() => setStaffPinInput('')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-rose-400">Clear</button>
                      </div>

                      {staffPinError && (
                        <p className="text-rose-400 text-xs font-bold text-center mt-1.5">{staffPinError}</p>
                      )}
                    </div>

                    <div className="my-2">
                      {!showStaffKeyboard ? (
                        <NumericKeypad value={staffPinInput} onChange={setStaffPinInput} maxLength={8} />
                      ) : (
                        <Input 
                          type="password"
                          value={staffPinInput}
                          onChange={e => setStaffPinInput(e.target.value.toUpperCase())}
                          placeholder="TYPE PIN HERE"
                          className="text-center font-mono text-xl h-12 bg-slate-900 text-white"
                        />
                      )}
                    </div>

                    <Button 
                      onClick={handleStaffAuth} 
                      className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-950 active:scale-[0.98]"
                    >
                      {isEs ? "Desbloquear Estación" : "Unlock Station"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                        {isEs ? "Personal Autenticado" : "Authenticated Staff"}
                      </p>
                      <h2 className="text-lg font-black text-white">{staffName}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {canAccessKioskSettings && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPrinterDialog(true)} 
                          className="h-8 text-xs font-bold border-blue-500/30 text-blue-400 bg-blue-950/20 hover:bg-blue-900/30 rounded-xl"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          <span>{isEs ? "Impresora" : "Printer Setup"}</span>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setStaffAuthed(false); setStaffPinInput(''); }} 
                        className="h-8 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1 text-rose-400" />
                        {isEs ? "Cerrar" : "Lock Terminal"}
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="search" className="flex-1 flex flex-col justify-between pt-2">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800 h-9 p-0.5 rounded-xl">
                      <TabsTrigger value="search" className="text-xs font-bold">{isEs ? "Búsqueda Manual" : "Children Search"}</TabsTrigger>
                      <TabsTrigger value="shifts" className="text-xs font-bold">{isEs ? "Turnos de Personal" : "Staff Shifts"}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="flex-1 flex flex-col justify-between pt-2">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input 
                          value={staffSearchTerm} 
                          onChange={e => setStaffSearchTerm(e.target.value)} 
                          placeholder={isEs ? "Buscar niño por nombre..." : "Type child name to search..."} 
                          className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs text-white rounded-xl" 
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[360px]">
                        {staffSearchResults.map(child => (
                          <div 
                            key={child.id} 
                            onClick={() => handleStaffCheckIn(child)}
                            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-300 font-black flex items-center justify-center">
                                {child.first_name[0]}
                              </div>
                              <div>
                                <p className="font-black text-xs text-white">{child.first_name} {child.last_name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">ID: {child.parent_id?.slice(0, 8)}</p>
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[9px] font-bold border-emerald-500/30 text-emerald-400 bg-emerald-950/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRegisteringNFC(child.parent_id);
                                startNfc();
                                toast({ title: isEs ? "Listo para NFC" : "Ready for NFC", description: isEs ? "Toque el teléfono o etiqueta del padre." : "Please tap the parent's device or sticker now." });
                              }}
                            >
                              <Smartphone className="w-3 h-3 mr-1" />
                              Link Tag
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="shifts" className="flex-1 overflow-y-auto max-h-[380px] pt-2 space-y-2">
                      {isLoadingShifts ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-400" /></div>
                      ) : staffShifts.length > 0 ? (
                        staffShifts.map(shift => (
                          <div key={shift.shift_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-white">{shift.class_name || 'General Support'}</p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!shift.actual_start_time ? (
                              <Button size="sm" onClick={() => handleShiftAction(shift.shift_id, 'check_in')} className="h-8 bg-blue-600 text-xs font-bold">
                                Start Shift
                              </Button>
                            ) : !shift.actual_end_time ? (
                              <Button size="sm" onClick={() => handleShiftAction(shift.shift_id, 'check_out')} className="h-8 bg-rose-600 text-xs font-bold">
                                End Shift
                              </Button>
                            ) : (
                              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30">Completed</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-center text-slate-500 py-8">No scheduled shifts for today.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ─── Dialogs & Overlays ─── */}
      <ClassSelectionDialog 
        open={showClassDialog} 
        onClose={() => setShowClassDialog(false)} 
        onConfirm={handleClassSelected} 
        childName={selectedChild?.first_name || ''} 
        initialClassId={selectedChild?.class_id}
        orgId={activeOrgId}
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
        <DialogContent className="max-w-md p-0 overflow-hidden bg-slate-900 border-slate-800 text-white">
          <DialogHeader className="p-5 bg-slate-950 border-b border-slate-800">
            <DialogTitle>Verification Signature</DialogTitle>
            <DialogDescription className="text-slate-400">Please provide a signature for {pendingCheckoutRecord?.child?.first_name}.</DialogDescription>
          </DialogHeader>
          <div className="p-5">
              <div className="border border-slate-700 bg-white rounded-xl p-1 overflow-hidden">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{ width: 380, height: 180, className: 'w-full h-[180px]' }}
                />
              </div>
              <DialogFooter className="mt-4 flex sm:justify-between items-center w-full">
                <Button variant="ghost" size="sm" onClick={() => signatureRef.current?.clear()} className="text-slate-400 hover:text-white">
                  <Eraser className="w-4 h-4 mr-1" /> Reset
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSignatureDialog(false)} className="border-slate-700 text-slate-300">Cancel</Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 font-bold" onClick={() => {
                    const dataUrl = signatureRef.current?.getTrimmedCanvas().toDataURL('image/png');
                    if (signatureRef.current?.isEmpty()) {
                      toast({ title: "Incomplete", description: "Signature is required.", variant: "destructive" });
                      return;
                    }
                    handleCheckOut(pendingCheckoutRecord, dataUrl);
                  }}>Authorize Exit</Button>
                </div>
              </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kiosk Printer & Print Server Setup Dialog */}
      <Dialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Printer className="h-5 w-5 text-blue-400" />
              Kiosk Printer & Print Server Setup
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure the Print Server IP and Label Printer for this Kiosk terminal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Print Server PC IP (Port 3003)
              </label>
              <div className="flex gap-2">
                <Input
                  value={printServerIp}
                  onChange={(e) => setPrintServerIp(e.target.value)}
                  placeholder="e.g. 192.168.1.150"
                  className="font-mono bg-slate-950 border-slate-800 text-white"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={testPrinterConnection} 
                  disabled={isTestingPrinter}
                  className="border-slate-700 text-slate-200"
                >
                  {isTestingPrinter ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test IP'}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Target Wireless Printer IP (Optional)
              </label>
              <Input
                value={targetPrinterIp}
                onChange={(e) => setTargetPrinterIp(e.target.value)}
                placeholder="e.g. 192.168.2.169"
                className="font-mono bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Printer Model / Name
              </label>
              <Input
                value={targetPrinterName}
                onChange={(e) => setTargetPrinterName(e.target.value)}
                placeholder="e.g. Brother QL-820NWB"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPrinterDialog(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button onClick={savePrinterSettings} className="bg-blue-600 hover:bg-blue-500 font-bold gap-1.5">
              <CheckCircle className="h-4 w-4" /> Save Printer Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default KioskCheckInSystem;

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

/**
 * High-Definition Tactile Touch Keypad (Ergonomic 3x4 Zero-Scroll Grid)
 */
const NumericKeypad: React.FC<{ 
  value: string; 
  onChange: (val: string) => void; 
  onEnter?: () => void;
  maxLength?: number;
}> = ({ value, onChange, onEnter, maxLength = 8 }) => {
  const handlePress = (num: string) => {
    if (value.length < maxLength) onChange(value + num);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const keypadKeys = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto">
      {keypadKeys.map(({ num, letters }) => (
        <button 
          key={num} 
          type="button"
          className="h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 active:bg-blue-600 border border-slate-800/90 active:border-blue-500 rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-sm group"
          onClick={() => handlePress(num)}
        >
          <span className="text-lg sm:text-xl font-black text-slate-100 group-hover:text-white leading-none">{num}</span>
          {letters && <span className="text-[8px] font-bold text-slate-500 tracking-wider mt-0.5">{letters}</span>}
        </button>
      ))}
      
      <button 
        type="button"
        className="h-11 sm:h-12 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
        onClick={handleClear}
      >
        CLEAR
      </button>

      <button 
        type="button"
        className="h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 active:bg-blue-600 border border-slate-800/90 active:border-blue-500 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm group"
        onClick={() => handlePress('0')}
      >
        <span className="text-lg sm:text-xl font-black text-slate-100 group-hover:text-white">0</span>
      </button>

      <button 
        type="button"
        className="h-11 sm:h-12 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 active:scale-95 transition-all"
        onClick={handleBackspace}
        title="Backspace"
      >
        <Eraser className="w-4 h-4" />
      </button>
    </div>
  );
};

