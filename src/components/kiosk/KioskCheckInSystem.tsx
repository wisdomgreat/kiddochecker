
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Keyboard,
  Printer,
  Camera,
  ChevronDown,
  Wifi,
  BatteryFull,
  Maximize,
  ArrowLeft,
  Loader2,
  Info
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

const KioskCheckInSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showNameTagDialog, setShowNameTagDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkInQRData, setCheckInQRData] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');
  const [kioskPin, setKioskPin] = useState<string>('123456');
  const [requirePin, setRequirePin] = useState<boolean>(true);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [scannedQRToken, setScannedQRToken] = useState<string | null>(null);
  const [activeParentPin, setActiveParentPin] = useState<string>('');
  const [activeTab, setActiveTab] = useState<KioskTab>('search');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { generateQRCode } = useQRCodes();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load data
  useEffect(() => {
    loadChildren();
    loadRecentCheckIns();
    loadKioskSettings();
  }, []);

  // Request wake lock to keep screen on (kiosk mode)
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock not supported or denied');
      }
    };
    requestWakeLock();
    // Re-request on visibility change (screen tap to wake)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

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

  // Search children
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('children')
            .select('*')
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
            .limit(10);
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
    }, 400);
    return () => clearTimeout(searchTimer);
  }, [searchTerm]);

  const loadChildren = async () => {
    if (searchTerm.trim() !== '') return;
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .limit(20)
        .order('first_name');
      if (error) throw error;
      setChildren(data || []);
      setFilteredChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      const recentData = await AttendanceService.getTodaysAttendance();
      setRecentCheckIns(recentData.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  };

  const initiateCheckIn = async (child: Child) => {
    if (requirePin && !isUnlocked) {
      setIsLoading(true);
      try {
        const { data } = await (supabase
          .from('profiles')
          .select('security_pin')
          .eq('id', child.parent_id)
          .single() as any);
        if (data?.security_pin) {
          setActiveParentPin(data.security_pin);
        } else {
          setActiveParentPin(kioskPin);
        }
      } catch {
        setActiveParentPin(kioskPin);
      } finally {
        setIsLoading(false);
      }
      setPendingChild(child);
      setShowPinDialog(true);
      return;
    }
    setSelectedChild(child);
    setShowClassDialog(true);
  };

  const handlePinSuccess = () => {
    setIsUnlocked(true);
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
        qrToken: scannedQRToken || undefined
      });

      if (result.success) {
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
        await loadRecentCheckIns();
        setSearchTerm('');
        setFilteredChildren([]);

        if (selectedChild.allergies) {
          toast({
            title: "⚠️ ALLERGY ALERT",
            description: `${selectedChild.first_name} has allergies: ${selectedChild.allergies}`,
            variant: "destructive",
            duration: 10000,
          });
        }
        toast({
          title: "Check-in Successful!",
          description: `${selectedChild.first_name} ${selectedChild.last_name} checked into ${classData?.name || 'class'}`,
        });
        setShowNameTagDialog(true);
      } else {
        toast({ title: "Check-in Failed", description: result.error || "Failed to check in child", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred during check-in", variant: "destructive" });
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
        toast({ title: "Invalid QR Code", description: "This QR code is not valid or has expired", variant: "destructive" });
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

  const todayCheckedIn = recentCheckIns.length;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col select-none">
      {/* ═══════════════ Top Status Bar ═══════════════ */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-md text-white/70 text-xs font-medium shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>KiddoChecker Kiosk</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={toggleFullscreen} className="p-1 hover:bg-white/10 rounded transition-colors">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ═══════════════ Hero Header ═══════════════ */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-end justify-between mb-1">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Check-In
            </h1>
            <p className="text-indigo-300/80 text-xs sm:text-sm font-medium mt-0.5">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2 py-0.5">
              <Users className="w-3 h-3 mr-1" />
              {todayCheckedIn} today
            </Badge>
          </div>
        </div>
      </div>

      {/* ═══════════════ Tab Switcher ═══════════════ */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
          {[
            { id: 'search' as KioskTab, label: 'Search', icon: Search },
            { id: 'scan' as KioskTab, label: 'QR Scan', icon: QrCode },
            { id: 'info' as KioskTab, label: 'Help', icon: Info },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if(tab.id === 'search') setTimeout(() => searchInputRef.current?.focus(), 100); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ Main Content (scrollable) ═══════════════ */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

        {/* ──── SEARCH TAB ──── */}
        {activeTab === 'search' && (
          <>
            {/* Search Input */}
            <div className="relative">
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type child's name..."
                className="h-14 sm:h-16 text-base sm:text-lg pl-12 pr-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 rounded-2xl focus:bg-white/15 focus:border-indigo-400/50 transition-all"
                autoFocus
                disabled={isLoading}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 animate-spin" />}
            </div>

            {/* Results */}
            {searchTerm && filteredChildren.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-white/20" />
                <p className="text-white/50 text-sm">No children found for "{searchTerm}"</p>
                <p className="text-white/30 text-xs mt-1">Check the spelling or ask a staff member for help</p>
              </div>
            )}

            {filteredChildren.length > 0 && (
              <div className="space-y-2">
                {filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => initiateCheckIn(child)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/[0.12] hover:border-indigo-400/30 active:scale-[0.98] transition-all duration-150 text-left group"
                  >
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                      <span className="text-white font-bold text-sm sm:text-lg">
                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base sm:text-lg truncate">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {child.age && (
                          <span className="text-white/40 text-xs">Age {child.age}</span>
                        )}
                        {child.allergies && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] px-1.5 py-0">
                            ⚠ Allergy
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No search yet — show recent check-ins */}
            {!searchTerm && (
              <div className="space-y-2 pt-2">
                <h3 className="text-white/30 text-xs font-semibold uppercase tracking-wider px-1">Recent Check-ins</h3>
                {recentCheckIns.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-white/10" />
                    <p className="text-white/30 text-xs">No check-ins today yet</p>
                  </div>
                ) : (
                  recentCheckIns.map((record, index) => (
                    <div key={record.id || index} className="flex items-center gap-3 p-3 bg-emerald-500/[0.07] border border-emerald-500/10 rounded-xl">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">
                          {record.child?.first_name} {record.child?.last_name}
                        </p>
                      </div>
                      <span className="text-white/30 text-xs tabular-nums shrink-0">
                        {new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* ──── QR SCAN TAB ──── */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            {!showScanner ? (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Scan QR Code</h3>
                <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
                  Point the camera at a child's QR label to instantly check them in
                </p>
                <Button
                  size="lg"
                  onClick={() => setShowScanner(true)}
                  className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-semibold shadow-lg shadow-indigo-500/30"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Open Camera
                </Button>
                <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-sm mx-auto">
                  <p className="text-amber-300/80 text-xs">
                    <strong>Tip:</strong> You can also use a Bluetooth / USB barcode scanner. It works like a keyboard — just focus the search box and scan!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(false)}
                  className="text-white/70 border-white/20 hover:bg-white/10 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <QRCodeScanner onScanComplete={handleQRCodeScan} isScanning={showScanner} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── INFO TAB ──── */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            {/* How to check in */}
            <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
              <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                How to Check In
              </h4>
              <div className="space-y-2.5">
                {[
                  "Type the child's name in the Search tab",
                  "Tap the child's card to begin check-in",
                  "Select the class they're attending",
                  "Print the name tag (optional)",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-indigo-500/30 text-indigo-300 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</div>
                    <p className="text-white/60 text-xs leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bluetooth scanner */}
            <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                Bluetooth / USB Scanners
              </h4>
              <p className="text-white/50 text-xs leading-relaxed">
                Connect any standard Bluetooth or USB scanner to this device. Tap the search box and scan — the scanner types the code and presses Enter automatically.
              </p>
            </div>

            {/* Label Printer */}
            <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                Label Printers
              </h4>
              <p className="text-white/50 text-xs leading-relaxed">
                Install your label printer (Brother QL, Dymo, Zebra) on this device and set it as default. After check-in, a print dialog appears. Set paper to match your labels and margins to "None".
              </p>
            </div>

            {/* Camera issues */}
            <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                Camera Not Working?
              </h4>
              <p className="text-white/50 text-xs leading-relaxed">
                Ensure your browser has <strong className="text-white/70">Camera Permissions</strong> enabled for this site. On mobile, the site must be served over <strong className="text-white/70">HTTPS</strong>. You can also install this page as an app for better hardware access.
              </p>
            </div>

            {/* Install as App */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <Maximize className="w-4 h-4 text-indigo-400" />
                Install as App (Recommended)
              </h4>
              <p className="text-white/50 text-xs leading-relaxed">
                For the best experience, install KiddoChecker on your tablet:
                <br />• <strong className="text-white/70">Chrome:</strong> Tap ⋮ → "Install app" or "Add to Home Screen"
                <br />• <strong className="text-white/70">Safari:</strong> Tap Share → "Add to Home Screen"
                <br />This gives fullscreen mode, keeps the screen on, and enables all hardware.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ Dialogs ═══════════════ */}
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
            setIsUnlocked(false);
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
