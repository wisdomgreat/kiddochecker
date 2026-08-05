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

  const handleQRScan = async (rawQRData: string) => {
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
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden text-foreground font-sans">
      
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 bg-card border-b shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-6 gap-1.5 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {settings?.name || 'KiddoChecker'}
          </Badge>
          {nfcSupported ? (
            <Badge variant="outline" className="h-6 gap-1.5 font-bold border-emerald-500/30 text-emerald-700 bg-emerald-50/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              NFC Active
            </Badge>
          ) : (
            <Badge variant="outline" className="h-6 gap-1.5 font-bold border-slate-500/30 text-slate-700 bg-slate-50/50">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-400" />
              NFC Standby
            </Badge>
          )}
        </div>
        
        {/* Premium Glassmorphic Congregation Switcher */}
        <div className="relative flex items-center bg-muted/70 p-1.5 rounded-full border border-border/40 shadow-inner max-w-sm backdrop-blur-md">
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
                className={`relative px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {org.slug === 'english' ? '🇬🇧 EN' : org.slug === 'spanish' ? '🇪🇸 ES' : org.slug === 'combined' ? '🤝 COMBINED / COMBINADO' : org.name}
              </button>
            );
          })}
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
             <span className="text-emerald-600 uppercase tracking-tight">{checkedInChildren.length} Present</span>
             <span className="w-px h-3 bg-border" />
             <span className="text-muted-foreground uppercase tracking-tight">{todayCount} Total</span>
             <span className="w-px h-3 bg-border" />
             <span className="text-foreground">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {canAccessKioskSettings && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPrinterDialog(true)} 
              className="h-8 gap-1.5 border-primary/30 text-primary font-bold hover:bg-primary/10 animate-in fade-in"
              title="Printer & Print Server Setup"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Printer Setup</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleFs} className="h-8 w-8"><Maximize className="h-4 w-4" /></Button>
        </div>
      </header>

      {isRegisteringNFC && (
        <div className="fixed inset-0 z-[100] bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <KeyRound className="w-12 h-12 text-white" />
           </div>
           <h2 className="text-3xl font-bold mb-2">Ready to Link</h2>
           <p className="text-lg opacity-90 max-w-md mb-8">Please tap the physical tag or phone against the reader now to link it to this account.</p>
           <Button variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setIsRegisteringNFC(null)}>Cancel Registration</Button>
        </div>
      )}

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
                  <h2 className="text-xl font-bold tracking-tight">
                    {isEs ? "Verificación de Padres" : "Parent Verification"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isEs ? "Inicie sesión con su teléfono o escanee el QR familiar" : "Sign in with phone or scan QR profile"}
                  </p>
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
                      <Button variant="ghost" onClick={() => setShowParentScanner(false)} className="w-full text-xs font-bold uppercase tracking-wider">
                        {isEs ? "Cancelar Escaneo" : "Cancel Scan"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowParentScanner(true)} 
                      className="w-full h-24 flex flex-col gap-2 rounded-2xl border-dashed border-2 hover:bg-muted/50"
                    >
                      <QrCode className="h-6 w-6 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {isEs ? "Escanear Código QR Familiar" : "Scan Family QR Code"}
                      </span>
                    </Button>
                  )}
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Phone className={cn("absolute left-3 top-3 h-4 w-4", activeInput === 'phone' ? "text-primary" : "text-muted-foreground")} />
                      <Input 
                        value={parentPhone} 
                        onFocus={() => setActiveInput('phone')}
                        onChange={e => setParentPhone(formatPhoneNumber(e.target.value))} 
                        placeholder={isEs ? "Número de Teléfono" : "Phone Number"} 
                        inputMode="none"
                        className={cn("h-10 pl-10 transition-all", activeInput === 'phone' && "ring-2 ring-primary/20 border-primary")} 
                      />
                    </div>
                    <div className="relative">
                      <Shield className={cn("absolute left-3 top-3 h-4 w-4", activeInput === 'pin' ? "text-primary" : "text-muted-foreground")} />
                      <Input 
                        type="password" 
                        value={parentPin} 
                        onFocus={() => setActiveInput('pin')}
                        onChange={e => setParentPin(e.target.value)} 
                        placeholder={isEs ? "PIN Directo" : "Direct PIN"} 
                        inputMode="none"
                        className={cn("h-10 pl-10 transition-all", activeInput === 'pin' && "ring-2 ring-primary/20 border-primary")} 
                        maxLength={8} 
                      />
                    </div>
                    {parentLoginError && <p className="text-destructive text-xs font-bold text-center">{parentLoginError}</p>}
                    <Button onClick={handleParentLogin} disabled={isLoading} className="w-full h-10 font-bold uppercase tracking-wide">
                      {isEs ? "Buscar Identificación" : "Identification Search"}
                    </Button>
                    
                    <NumericKeypad 
                      value={activeInput === 'phone' ? parentPhone.replace(/\D/g, '') : parentPin} 
                      onChange={handleKeypadChange} 
                      maxLength={activeInput === 'phone' ? 10 : 8}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'parent' && parentLoggedIn && (
            <div className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {isEs ? "Cuenta Familiar" : "Family Account"}
                  </p>
                  <h2 className="text-xl font-bold">{parentName}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={handleParentLogout} className="text-xs h-8">
                  <LogOut className="w-3 h-3 mr-1.5" /> {isEs ? "Cerrar Sesión" : "Sign Out"}
                </Button>
              </div>

              {/* NFC Self-Link Option for Parents at Kiosk */}
              <Card className="bg-emerald-50 border-emerald-100 shadow-none rounded-2xl overflow-hidden border">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                         <Smartphone className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                          {isEs ? "Configuración Rápida" : "Quick Setup"}
                         </p>
                         <p className="font-bold text-sm text-foreground">
                          {isEs ? "Vincular Etiqueta NFC" : "Link NFC Tag"}
                         </p>
                      </div>
                   </div>
                   <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-background border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9 font-bold"
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
                      {isRegisteringNFC === window.localStorage.getItem('kiosk_active_parent_id') 
                        ? (isEs ? "Esperando toque..." : "Waiting for Tap...") 
                        : (isEs ? "Vincular mi Etiqueta" : "Link My Tag")}
                   </Button>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {parentChildren.map(child => {
                  const checked = alreadyIn(child.id);
                  return (
                    <Card key={child.id} className={cn("overflow-hidden cursor-pointer hover:border-primary/50 transition-all rounded-2xl shadow-sm", checked ? "border-red-200 hover:border-red-400 bg-red-50/10" : "hover:border-primary/50")}>
                        <CardContent className="p-5" onClick={() => handleParentCheckIn(child)}>
                            <div className="flex items-center gap-5">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all shadow-inner", checked ? "bg-red-500 text-white shadow-red-100" : "bg-muted text-muted-foreground")}>
                                    {checked ? <CheckCircle className="w-7 h-7" /> : child.first_name[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-base">{child.first_name} {child.last_name}</p>
                                    <p className={cn("text-[10px] uppercase font-bold", checked ? "text-red-500 animate-pulse" : "text-muted-foreground")}>
                                        {checked 
                                          ? (isEs ? "Registrado • Tocar para Salida" : "Checked In • Tap to Check Out") 
                                          : (isEs ? "Disponible para entrada" : "Available for check-in")}
                                    </p>
                                </div>
                                {checked ? (
                                    <LogOut className="w-4 h-4 text-red-500 animate-pulse" />
                                ) : (
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                )}
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
                        <h2 className="text-2xl font-bold tracking-tight">
                          {isEs ? "Autoregistro de Jóvenes" : "Youth Self-Check"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {isEs ? "Ingrese su PIN de seguridad para registrar entrada/salida" : "Enter security PIN to log entry/exit"}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="password"
                                inputMode="none"
                                maxLength={6}
                                placeholder={isEs ? "PIN de Seguridad" : "Security PIN"}
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
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEs ? "Verificar Identidad" : "Verify Identity")}
                        </Button>
                        
                        <NumericKeypad 
                          value={youthPinInput} 
                          onChange={setYouthPinInput} 
                          maxLength={6}
                        />
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
                            <h2 className="text-2xl font-bold">
                              {isEs ? "Acceso de Personal" : "Staff Access"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {isEs ? "Se requiere PIN de identificación" : "Identification PIN required"}
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                          <Input 
                            type="password" 
                            value={staffPinInput} 
                            onChange={e => setStaffPinInput(e.target.value.toUpperCase())} 
                            placeholder={isEs ? "PIN DE PERSONAL" : "STAFF PIN"} 
                            inputMode={showStaffKeyboard ? undefined : "none"}
                            className="h-16 text-center text-3xl tracking-[0.6em] font-bold rounded-2xl bg-muted border-none shadow-inner" 
                          />
                          
                          <div className="flex justify-center">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 gap-2"
                                onClick={() => setShowStaffKeyboard(!showStaffKeyboard)}
                             >
                                <PenTool className="h-3 w-3" />
                                {showStaffKeyboard 
                                  ? (isEs ? "Usar Teclado Numérico" : "Use Numeric Keypad") 
                                  : (isEs ? "Usar Teclado Completo" : "Use Full Keyboard")}
                             </Button>
                          </div>

                          {!showStaffKeyboard ? (
                            <NumericKeypad 
                              value={staffPinInput} 
                              onChange={setStaffPinInput} 
                              maxLength={8}
                            />
                          ) : (
                            <p className="text-[10px] text-center text-slate-400 font-medium">
                              {isEs ? "Use su teclado para escribir su PIN alfanumérico." : "Please use your physical or on-screen keyboard to type your alphanumeric PIN."}
                            </p>
                          )}
                        </div>

                        <Button onClick={handleStaffAuth} className="w-full h-14 font-bold uppercase text-base tracking-wider rounded-2xl">
                          {isEs ? "Desbloquear Estación" : "Unlock Station"}
                        </Button>
                        {staffPinError && <p className="text-destructive text-center text-xs font-bold uppercase tracking-tight">{staffPinError}</p>}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center bg-card p-5 border rounded-2xl shadow-sm">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">
                            {isEs ? "Personal Autenticado" : "Authenticated Staff"}
                          </p>
                          <p className="font-bold text-lg">{staffName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {canAccessKioskSettings && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowPrinterDialog(true)} 
                              className="h-9 gap-1.5 border-primary/30 text-primary font-bold hover:bg-primary/10"
                            >
                              <Printer className="h-4 w-4" />
                              <span>{isEs ? "Configurar Impresora" : "Printer Setup"}</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      <Tabs defaultValue="search" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="search">{isEs ? "Niños" : "Children"}</TabsTrigger>
                          <TabsTrigger value="shifts">{isEs ? "Turnos" : "Shifts"}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                          <Card className="p-4 bg-muted/20 border-dashed">
                             <QRCodeScanner onScanComplete={handleQRScan} />
                          </Card>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input value={staffSearchTerm} onChange={e => setStaffSearchTerm(e.target.value)} placeholder={isEs ? "Búsqueda manual..." : "Manual search..."} className="pl-10" />
                          </div>
                          <div className="grid gap-2">
                            {staffSearchResults.map(child => (
                              <Card key={child.id} className="overflow-hidden border shadow-none">
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1" onClick={() => handleStaffCheckIn(child)}>
                                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">{child.first_name[0]}</div>
                                      <div>
                                          <p className="font-bold text-sm leading-tight">{child.first_name} {child.last_name}</p>
                                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Parent ID: {child.parent_id?.slice(0,8)}</p>
                                      </div>
                                    </div>
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-[10px] font-bold gap-1.5 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsRegisteringNFC(child.parent_id);
                                        startNfc();
                                        toast({ title: isEs ? "Listo para NFC" : "Ready for NFC", description: isEs ? "Toque el teléfono o etiqueta del padre." : "Please tap the parent's device or sticker now." });
                                      }}
                                    >
                                      <KeyRound className="w-3 h-3" />
                                      {isRegisteringNFC === child.parent_id ? (isEs ? "Esperando..." : "Waiting...") : (isEs ? "Vincular" : "Link Tag")}
                                    </Button>
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
                                      {isEs ? "Iniciar Turno" : "Start Shift"}
                                    </Button>
                                  ) : !shift.actual_end_time ? (
                                    <div className="space-y-2">
                                      <p className="text-[10px] text-emerald-600 font-bold text-center">
                                        {isEs ? "Activo desde: " : "Active: "}{new Date(shift.actual_start_time).toLocaleTimeString()}
                                      </p>
                                      <Button variant="outline" onClick={() => handleShiftAction(shift.shift_id, 'check_out')} className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 h-9 font-bold">
                                        {isEs ? "Finalizar Turno" : "End Shift"}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="text-center p-2 bg-emerald-50 rounded-md">
                                      <p className="text-[10px] text-emerald-600 font-bold">
                                        {isEs ? "Completado a las " : "Completed at "}{new Date(shift.actual_end_time).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <p className="text-sm">{isEs ? "No hay turnos programados para hoy." : "No shifts found for today."}</p>
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
                    <p className="text-sm font-bold uppercase tracking-tight">
                      {isEs ? "Se Requiere ID de Seguridad" : "Security ID Required"}
                    </p>
                    <p className="text-xs pt-1">
                      {isEs ? "Por favor identifíquese primero como Padre o Personal" : "Please identify as Parent or Staff first"}
                    </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={checkoutSearch} onChange={e => setCheckoutSearch(e.target.value)} placeholder={isEs ? "Filtrar niños..." : "Filter children..."} className="pl-10" />
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
                            <Button size="sm" onClick={() => initiateCheckOut(record)} className="font-bold uppercase text-[10px] h-8 px-4">
                              {isEs ? "Registrar Salida" : "Log Exit"}
                            </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {checkoutFilteredChildren.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            <p className="text-sm font-bold uppercase">
                              {isEs ? "No se encontraron registros" : "No records found"}
                            </p>
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Dev Mode NFC Emulator */}
          {(!nfcSupported || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <div className="mt-8 p-5 bg-slate-950 text-slate-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Developer Console</p>
                  <p className="text-sm font-bold text-slate-200">Hardware NFC Simulator</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Input 
                  placeholder="Tag UID (e.g. nfc-101)" 
                  className="bg-slate-900 border-slate-700 text-white h-9 text-xs rounded-xl" 
                  id="dev-nfc-input"
                />
                <Button 
                  variant="secondary"
                  size="sm"
                  className="h-9 px-4 font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-xl"
                  onClick={() => {
                    const el = document.getElementById('dev-nfc-input') as HTMLInputElement;
                    const val = el?.value || 'nfc-101';
                    console.log('[Dev NFC] Simulating NFC tap with serial:', val);
                    if (isRegisteringNFC) {
                      handleNfcRegister(val);
                    } else {
                      handleNfcLogin(val);
                    }
                  }}
                >
                  Simulate Tap
                </Button>
              </div>
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
              <DialogFooter className="mt-4 flex sm:justify-between items-center w-full">
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
              </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── IP Lockdown Block Warning Screen ─── */}
      {securityBlockedIp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="max-w-md w-full mx-4 p-8 rounded-2xl border border-rose-500/35 bg-slate-900/90 text-white shadow-2xl shadow-rose-950/40 text-center space-y-6">
            <div className="inline-flex p-4 bg-rose-500/10 border border-rose-500/25 rounded-full text-rose-500 animate-pulse">
              <ShieldAlert className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-rose-500 uppercase">Terminal Access Locked</h2>
              <p className="text-xs font-semibold tracking-wider text-rose-400 uppercase">Unauthorized Physical Location Network</p>
            </div>
            
            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-950/50 text-left space-y-3">
              <p className="text-xs text-rose-200 leading-relaxed">
                This kiosk check-in terminal is attempting to authenticate from an external, unauthorized IP address:
              </p>
              <div className="font-mono text-sm bg-rose-950/40 text-rose-300 py-1.5 px-3 rounded border border-rose-900 font-bold select-all text-center">
                {securityBlockedIp}
              </div>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                To enable access, this IP address must be registered under the authorized location settings in the Admin Dashboard panel.
              </p>
            </div>
            
            <div className="pt-2 flex flex-col gap-2">
              <Button 
                onClick={() => setSecurityBlockedIp(null)} 
                variant="outline" 
                className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700/80 hover:text-white"
              >
                Dismiss Notice
              </Button>
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">
                Security Policy SEC-01 • Active Protection
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Kiosk Printer & Print Server Setup Dialog */}
      <Dialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Kiosk Printer & Print Server Setup
            </DialogTitle>
            <DialogDescription>
              Configure the Linux Print Server IP and Label Printer for this Kiosk terminal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                Print Server PC IP (Linux Server)
              </label>
              <div className="flex gap-2">
                <Input
                  value={printServerIp}
                  onChange={(e) => setPrintServerIp(e.target.value)}
                  placeholder="e.g. 192.168.1.150"
                  className="font-mono"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={testPrinterConnection} 
                  disabled={isTestingPrinter}
                >
                  {isTestingPrinter ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test IP'}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Local IP address of the Linux PC running print server on port 3003.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                Target Wireless Printer IP (Optional)
              </label>
              <Input
                value={targetPrinterIp}
                onChange={(e) => setTargetPrinterIp(e.target.value)}
                placeholder="e.g. 192.168.1.101 (Leave blank for default)"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Assign Printer 1 (e.g. .101) or Printer 2 (e.g. .102) to this kiosk.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                Printer Model / Name
              </label>
              <Input
                value={targetPrinterName}
                onChange={(e) => setTargetPrinterName(e.target.value)}
                placeholder="e.g. DYMO LabelWriter 450"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPrinterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePrinterSettings} className="gap-1.5 font-bold">
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
 * Numeric Keypad for touch-friendly PIN entry
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

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto mt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <Button 
          key={num} 
          variant="outline" 
          type="button"
          className="h-14 text-xl font-bold rounded-xl active:scale-95 transition-transform"
          onClick={() => handlePress(num.toString())}
        >
          {num}
        </Button>
      ))}
      <Button 
        variant="ghost" 
        type="button"
        className="h-14 text-[10px] font-bold uppercase text-muted-foreground"
        onClick={handleClear}
      >
        Clear
      </Button>
      <Button 
        variant="outline" 
        type="button"
        className="h-14 text-xl font-bold rounded-xl active:scale-95 transition-transform"
        onClick={() => handlePress('0')}
      >
        0
      </Button>
      <Button 
        variant="ghost" 
        type="button"
        className="h-14 flex items-center justify-center"
        onClick={handleBackspace}
      >
        <Eraser className="w-5 h-5 text-muted-foreground" />
      </Button>
    </div>
  );
};

