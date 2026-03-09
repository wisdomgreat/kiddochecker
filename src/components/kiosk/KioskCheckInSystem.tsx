
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  Search,
  UserCheck,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Printer,
  Camera,
  Maximize,
  ArrowLeft,
  Loader2,
  Info,
  MapPin,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import ClassSelectionDialog from './ClassSelectionDialog';
import NameTagPrintDialog from './NameTagPrintDialog';
import { useQRCodes } from '@/hooks/useQRCodes';
import PINDialog from './PINDialog';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
  age?: number;
  allergies?: string;
}

type KioskTab = 'search' | 'scan' | 'info';

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const KioskCheckInSystem = () => {
  // ─── State ─────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showNameTagDialog, setShowNameTagDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkInQRData, setCheckInQRData] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');
  const [kioskPin, setKioskPin] = useState<string>('123456');
  const [requirePin, setRequirePin] = useState<boolean>(true);
  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [scannedQRToken, setScannedQRToken] = useState<string | null>(null);
  const [activeParentPin, setActiveParentPin] = useState<string>('');
  const [activeTab, setActiveTab] = useState<KioskTab>('search');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [lastCheckInName, setLastCheckInName] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { generateQRCode } = useQRCodes();

  // ─── Clock ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Load Data ─────────────────────────────────────────
  useEffect(() => {
    loadTodayCount();
    loadKioskSettings();
    requestGeoLocation();
  }, []);

  // ─── Wake Lock (keep screen on) ───────────────────────
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // ─── Geolocation ──────────────────────────────────────
  const requestGeoLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          console.log('[Kiosk] Location acquired:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('[Kiosk] Geolocation denied or unavailable:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const loadKioskSettings = async () => {
    try {
      const { data } = await (supabase.from('kiosk_settings' as any) as any).select('*');
      if (data) {
        const settings = data as any[];
        const pinSetting = settings.find((s: any) => s.setting_key === 'kiosk_pin');
        const requirePinSetting = settings.find((s: any) => s.setting_key === 'require_pin');
        if (pinSetting) setKioskPin(pinSetting.setting_value);
        if (requirePinSetting) setRequirePin(requirePinSetting.setting_value === 'true');
      }
    } catch (error) {
      console.error('Error loading kiosk settings:', error);
    }
  };

  const loadTodayCount = async () => {
    try {
      const recentData = await AttendanceService.getTodaysAttendance();
      setTodayCount(recentData.length);
    } catch {
      setTodayCount(0);
    }
  };

  // ─── Search (security-first: require 3+ chars) ────────
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchTerm.trim().length >= 3) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('children')
            .select('id, first_name, last_name, parent_id, age, allergies')
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
            .limit(8);
          if (error) throw error;
          setFilteredChildren(data || []);
        } catch (err) {
          console.error('Kiosk search error:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setFilteredChildren([]);
      }
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [searchTerm]);

  // ─── Check-In Flow ────────────────────────────────────
  const initiateCheckIn = async (child: Child) => {
    // ALWAYS require PIN on kiosk — this is a security requirement.
    // The PIN verifies WHO is checking in the child.
    setIsLoading(true);
    try {
      // Fetch parent's specific PIN
      const { data } = await (supabase
        .from('profiles')
        .select('security_pin')
        .eq('id', child.parent_id)
        .single() as any);
      if (data?.security_pin) {
        setActiveParentPin(data.security_pin);
      } else {
        // Fallback to global kiosk pin if parent hasn't set one
        setActiveParentPin(kioskPin);
      }
    } catch {
      setActiveParentPin(kioskPin);
    } finally {
      setIsLoading(false);
    }
    setPendingChild(child);
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
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();

      const result = await AttendanceService.checkInChild({
        childId: selectedChild.id,
        classId,
        checkedInBy: undefined,
        qrToken: scannedQRToken || undefined,
      });

      if (result.success) {
        // Log geolocation to device activity log for audit
        if (geoLocation) {
          try {
            await (supabase.from('device_activity_log' as any) as any).insert({
              action: 'check_in',
              metadata: {
                child_id: selectedChild.id,
                child_name: `${selectedChild.first_name} ${selectedChild.last_name}`,
                class_id: classId,
                class_name: classData?.name,
                latitude: geoLocation.latitude,
                longitude: geoLocation.longitude,
                accuracy: geoLocation.accuracy,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (e) {
            console.warn('[Kiosk] Failed to log check-in location:', e);
          }
        }

        const { data: qrCodeData } = await supabase
          .from('qr_codes')
          .select('qr_data')
          .eq('child_id', selectedChild.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setCheckInQRData(qrCodeData?.qr_data || '');
        setSelectedClassName(classData?.name || '');
        setLastCheckInName(`${selectedChild.first_name} ${selectedChild.last_name}`);
        await loadTodayCount();
        setSearchTerm('');
        setFilteredChildren([]);

        if (selectedChild.allergies) {
          toast({
            title: "⚠️ ALLERGY ALERT",
            description: `${selectedChild.first_name}: ${selectedChild.allergies}`,
            variant: "destructive",
            duration: 10000,
          });
        }

        toast({
          title: "✅ Check-in Successful!",
          description: `${selectedChild.first_name} ${selectedChild.last_name} → ${classData?.name || 'class'}`,
        });
        setShowNameTagDialog(true);
      } else {
        toast({ title: "Check-in Failed", description: result.error || "Could not check in", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeScan = async (qrData: string) => {
    try {
      setIsLoading(true);
      const { data: qrRecord, error: qrError } = await supabase
        .from('qr_codes')
        .select('*, child:children(*)')
        .eq('qr_data', qrData)
        .eq('is_active', true)
        .single();

      if (qrError || !qrRecord) {
        toast({ title: "Invalid QR Code", description: "This code is not recognized or has expired", variant: "destructive" });
        return;
      }
      setScannedQRToken(qrData);
      setShowScanner(false);
      setActiveTab('search');
      initiateCheckIn(qrRecord.child as any);
    } catch {
      toast({ title: "Error", description: "Failed to process QR code", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col select-none">
      {/* ═══ Status Bar ═══ */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-md text-white/60 text-xs font-medium shrink-0 safe-area-top">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>KiddoChecker</span>
          {geoLocation && (
            <span className="flex items-center gap-0.5 text-emerald-400/60">
              <MapPin className="w-2.5 h-2.5" />
              <span className="text-[10px]">GPS</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={toggleFullscreen} className="p-1 hover:bg-white/10 rounded transition-colors">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ Header ═══ */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Check-In</h1>
            <p className="text-indigo-300/60 text-xs font-medium mt-0.5">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/5 text-white/60 border-white/10 text-xs px-2.5 py-1">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
              {todayCount} checked in
            </Badge>
          </div>
        </div>

        {/* Success flash */}
        {lastCheckInName && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-xs font-medium truncate">
              {lastCheckInName} checked in successfully
            </p>
          </div>
        )}
      </div>

      {/* ═══ Tab Switcher ═══ */}
      <div className="px-4 pb-2 shrink-0">
        <div className="flex bg-white/[0.04] backdrop-blur-sm rounded-2xl p-1 border border-white/[0.06]">
          {[
            { id: 'search' as KioskTab, label: 'Search', icon: Search },
            { id: 'scan' as KioskTab, label: 'QR Scan', icon: QrCode },
            { id: 'info' as KioskTab, label: 'Help', icon: Info },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if(tab.id === 'search') setTimeout(() => searchInputRef.current?.focus(), 150); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">

        {/* ──── SEARCH TAB ──── */}
        {activeTab === 'search' && (
          <>
            <div className="relative">
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter child's full name (min. 3 letters)..."
                className="h-14 sm:h-16 text-base sm:text-lg pl-12 pr-4 bg-white/[0.07] backdrop-blur-sm border-white/[0.12] text-white placeholder:text-white/30 rounded-2xl focus:bg-white/10 focus:border-indigo-400/40 transition-all"
                autoFocus
                disabled={isLoading}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 animate-spin" />}
            </div>

            {/* Security notice */}
            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/15 rounded-xl">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-300/80 text-xs">Please type at least 3 characters to search (for child safety)</p>
              </div>
            )}

            {/* No results */}
            {searchTerm.length >= 3 && filteredChildren.length === 0 && !isLoading && (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-white/15" />
                <p className="text-white/40 text-sm font-medium">No child found</p>
                <p className="text-white/25 text-xs mt-1">Check the spelling or ask a staff member</p>
              </div>
            )}

            {/* Results — only show initials until PIN verified */}
            {filteredChildren.length > 0 && (
              <div className="space-y-2">
                {filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => initiateCheckIn(child)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl hover:bg-white/[0.09] hover:border-indigo-400/20 active:scale-[0.98] transition-all duration-150 text-left group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/15 group-hover:shadow-indigo-500/25 transition-shadow">
                      <span className="text-white font-bold text-sm sm:text-lg">
                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base sm:text-lg truncate">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {child.age && <span className="text-white/30 text-xs">Age {child.age}</span>}
                        {child.allergies && (
                          <Badge className="bg-red-500/15 text-red-300/80 border-red-500/20 text-[10px] px-1.5 py-0">⚠ Allergy</Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-500/15 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-white/20 text-[9px] font-medium">PIN required</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!searchTerm && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 mx-auto bg-white/[0.03] rounded-3xl flex items-center justify-center border border-white/[0.06]">
                  <Search className="w-8 h-8 text-white/15" />
                </div>
                <div>
                  <p className="text-white/40 text-sm font-medium">Search for a child to check in</p>
                  <p className="text-white/20 text-xs mt-1">Or switch to QR Scan tab for faster check-in</p>
                </div>

                {/* Quick security note */}
                <div className="max-w-xs mx-auto p-3 bg-indigo-500/[0.06] border border-indigo-500/10 rounded-xl">
                  <p className="text-indigo-300/50 text-[10px] leading-relaxed flex items-start gap-1.5">
                    <Shield className="w-3 h-3 mt-0.5 shrink-0" />
                    Every check-in requires PIN verification. Location and time are automatically recorded for safety.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ──── QR SCAN TAB ──── */}
        {activeTab === 'scan' && (
          <div className="space-y-3">
            {!showScanner ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-5 bg-white/[0.04] rounded-3xl border-2 border-dashed border-white/15 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-indigo-400/70" />
                </div>
                <h3 className="text-white text-lg font-bold mb-1.5">Scan QR Code</h3>
                <p className="text-white/30 text-xs mb-5 max-w-xs mx-auto">
                  Point the camera at a child's QR label. PIN verification is still required.
                </p>
                <Button
                  size="lg"
                  onClick={() => setShowScanner(true)}
                  className="h-13 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Open Camera
                </Button>
                <div className="mt-5">
                  <QRCodeScanner
                    onScanComplete={handleQRCodeScan}
                    darkMode={true}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(false)}
                  className="text-white/60 border-white/15 hover:bg-white/5 rounded-xl text-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back
                </Button>
                <QRCodeScanner
                  onScanComplete={handleQRCodeScan}
                  autoStart={true}
                  darkMode={true}
                />
              </div>
            )}
          </div>
        )}

        {/* ──── INFO TAB ──── */}
        {activeTab === 'info' && (
          <div className="space-y-2.5">
            {[
              {
                icon: Shield,
                title: 'Security & Safety',
                body: 'Every check-in/check-out requires a secure PIN. Location, time, and device information are automatically recorded in the audit log for child safeguarding.',
                accent: 'emerald'
              },
              {
                icon: UserCheck,
                title: 'How to Check In',
                body: '1. Search for the child by name (min. 3 characters)\n2. Tap the child\'s card\n3. Enter the parent\'s security PIN\n4. Select the class\n5. Print name tag (optional)',
                accent: 'indigo'
              },
              {
                icon: QrCode,
                title: 'Bluetooth / USB Scanners',
                body: 'Connect any Bluetooth or USB scanner. Tap the search box and scan — the scanner types the code and presses Enter automatically. PIN is still required after scanning.',
                accent: 'indigo'
              },
              {
                icon: Printer,
                title: 'Label Printers',
                body: 'Install your label printer (Brother QL, Dymo, Zebra) and set it as default. After check-in, a print dialog appears. Set paper to match your label size and margins to "None".',
                accent: 'indigo'
              },
              {
                icon: Camera,
                title: 'Camera Not Working?',
                body: 'Ensure Camera Permissions are allowed for this site. On mobile, HTTPS is required. Install this page as an app for best hardware access.',
                accent: 'amber'
              },
              {
                icon: Maximize,
                title: 'Install as App',
                body: 'Chrome: ⋮ → "Install app" or "Add to Home Screen"\nSafari: Share → "Add to Home Screen"\nThis gives fullscreen mode, keeps screen on, and enables all hardware.',
                accent: 'indigo'
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                <h4 className="text-white font-semibold text-xs mb-1.5 flex items-center gap-2">
                  <item.icon className={`w-3.5 h-3.5 text-${item.accent}-400`} />
                  {item.title}
                </h4>
                <p className="text-white/40 text-[11px] leading-relaxed whitespace-pre-line">{item.body}</p>
              </div>
            ))}
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
          onClose={() => {
            setShowNameTagDialog(false);
            setSelectedChild(null);
            setCheckInQRData('');
            setSelectedClassName('');
            setScannedQRToken(null);
          }}
          child={selectedChild}
          qrData={checkInQRData}
          className={selectedClassName}
        />
      )}

      <PINDialog
        open={showPinDialog}
        correctPin={activeParentPin || kioskPin}
        onClose={() => { setShowPinDialog(false); setPendingChild(null); setActiveParentPin(''); }}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
};

export default KioskCheckInSystem;
