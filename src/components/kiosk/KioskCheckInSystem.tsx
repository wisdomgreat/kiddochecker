
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Printer
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

interface CheckInResult {
  success: boolean;
  message: string;
  child?: Child;
}

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
  const { toast } = useToast();
  const { generateQRCode } = useQRCodes();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load children data
  useEffect(() => {
    loadChildren();
    loadRecentCheckIns();
    loadKioskSettings();
  }, []);

  const loadKioskSettings = async () => {
    try {
      const { data, error } = await (supabase
        .from('kiosk_settings' as any) as any)
        .select('*');

      if (data) {
        const settings = data as any[];
        const pinSetting = settings.find(s => s.setting_key === 'kiosk_pin');
        const requirePinSetting = settings.find(s => s.setting_key === 'require_pin');

        if (pinSetting) setKioskPin(pinSetting.setting_value);
        if (requirePinSetting) setRequirePin(requirePinSetting.setting_value === 'true');
      }
    } catch (error) {
      console.error('Error loading kiosk settings:', error);
    }
  };

  // Filter children based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChildren([]);
    } else {
      const filtered = children.filter(child =>
        `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChildren(filtered.slice(0, 10)); // Limit to 10 results
    }
  }, [searchTerm, children]);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('Error loading children:', error);
        return;
      }

      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      const recentData = await AttendanceService.getTodaysAttendance();
      setRecentCheckIns(recentData.slice(0, 5)); // Show last 5 check-ins
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  };

  const initiateCheckIn = (child: Child) => {
    if (requirePin && !isUnlocked) {
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
      // Get class name for the name tag
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();

      const result = await AttendanceService.checkInChild({
        childId: selectedChild.id,
        classId: classId,
        checkedInBy: undefined // System check-in
      });

      if (result.success) {
        // Generate QR code for checkout
        generateQRCode(selectedChild.id);

        const qrData = `child:${selectedChild.id}:${Date.now()}`;
        setCheckInQRData(qrData);
        setSelectedClassName(classData?.name || '');

        await loadRecentCheckIns();
        setSearchTerm('');
        setFilteredChildren([]);

        // Show allergy alert if present
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

        // Show name tag print dialog
        setShowNameTagDialog(true);
      } else {
        toast({
          title: "Check-in Failed",
          description: result.error || "Failed to check in child",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during check-in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeScan = async (qrData: string) => {
    try {
      // Parse QR data format: "child:childId:timestamp"
      const parts = qrData.split(':');
      if (parts[0] !== 'child' || !parts[1]) {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for check-in",
          variant: "destructive",
        });
        return;
      }

      const childId = parts[1];

      // Find the child
      const child = children.find(c => c.id === childId);
      if (!child) {
        toast({
          title: "Child Not Found",
          description: "Could not find child with this QR code",
          variant: "destructive",
        });
        return;
      }

      setShowScanner(false);
      initiateCheckIn(child);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Check-In Station</h1>
            <p className="text-slate-500 font-medium">Please search for your child or scan a QR code</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600 tabular-nums">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
              {currentTime.toLocaleTimeString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Check-in Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Search className="h-6 w-6" />
                  Find Child
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type child's name to search..."
                    className="text-xl h-14 pl-12"
                    disabled={isLoading}
                  />
                  <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
                </div>

                {searchTerm && filteredChildren.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg">No children found matching "{searchTerm}"</p>
                  </div>
                )}

                {filteredChildren.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredChildren.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary/50 bg-white"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">
                              {child.first_name} {child.last_name}
                            </h3>
                            {child.age && (
                              <p className="text-muted-foreground">Age: {child.age}</p>
                            )}
                            {child.allergies && (
                              <Badge variant="destructive" className="mt-1">
                                Allergies: {child.allergies}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => initiateCheckIn(child)}
                          disabled={isLoading}
                          className="h-16 px-8 text-lg"
                        >
                          <UserCheck className="h-6 w-6 mr-2" />
                          Check In
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code Scanner */}
            {!showScanner ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <QrCode className="h-6 w-6" />
                    QR Code Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold mb-4">Scan QR Code</h3>
                    <p className="text-lg text-muted-foreground mb-6">
                      Hold the QR code in front of the camera to check in
                    </p>
                    <Button
                      size="lg"
                      className="h-16 px-8 text-lg"
                      onClick={() => setShowScanner(true)}
                    >
                      <QrCode className="h-6 w-6 mr-2" />
                      Activate Scanner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <QRCodeScanner
                onScanComplete={handleQRCodeScan}
                isScanning={showScanner}
              />
            )}
          </div>

          {/* Side Panel - Recent Activity */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCheckIns.map((record, index) => (
                    <div key={record.id || index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {record.child?.first_name} {record.child?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.checked_in_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentCheckIns.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>No check-ins today yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  How to Check In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-sm">Type the child's name in the search box</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-sm">Select the child from the list</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-sm">Click the "Check In" button</p>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Alternative:</strong> Use the QR code scanner for faster check-ins
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Class Selection Dialog */}
      {selectedChild && (
        <ClassSelectionDialog
          open={showClassDialog}
          onClose={() => {
            setShowClassDialog(false);
            setSelectedChild(null);
          }}
          onConfirm={handleClassSelected}
          childName={`${selectedChild.first_name} ${selectedChild.last_name}`}
        />
      )}

      {/* Name Tag Print Dialog */}
      {selectedChild && (
        <NameTagPrintDialog
          open={showNameTagDialog}
          onClose={() => {
            setShowNameTagDialog(false);
            setSelectedChild(null);
            setCheckInQRData('');
            setSelectedClassName('');
            // Reset lock after a successful session
            setIsUnlocked(false);
          }}
          child={selectedChild}
          qrData={checkInQRData}
          className={selectedClassName}
        />
      )}

      {/* PIN Dialog */}
      <PINDialog
        open={showPinDialog}
        correctPin={kioskPin}
        onClose={() => {
          setShowPinDialog(false);
          setPendingChild(null);
        }}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
};

export default KioskCheckInSystem;
