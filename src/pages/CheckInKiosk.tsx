
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QrCode, User, Clock, Settings, Wifi, Search, UserPlus } from "lucide-react";
import { useDeviceRegistration } from "@/hooks/useDeviceRegistration";
import { useChildren } from "@/hooks/useChildren";
import { useClasses } from "@/hooks/useClasses";
import { useAttendance } from "@/hooks/useAttendance";
import { useDebounce } from "@/hooks/useDebounce";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorFallback from "@/components/error/ErrorFallback";
import LoginForm from "@/components/check-in/LoginForm";
import QRCodeScanner from "@/components/qr/QRCodeScanner";
import QuickCheckInPanel from "@/components/check-in/QuickCheckInPanel";

const CheckInKiosk = () => {
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Device registration
  const { 
    isRegistered,
    deviceName,
    showDeviceSetup,
    isSetupComplete,
    isLoading: deviceLoading,
    handleRegisterDevice,
    updateDeviceName
  } = useDeviceRegistration({
    deviceType: 'check_in_kiosk',
    defaultDeviceName: "Check-in/Check-out Kiosk"
  });

  // Data hooks with error handling
  const { children, isLoading: childrenLoading, error: childrenError } = useChildren();
  const { classes, isLoading: classesLoading, error: classesError } = useClasses();
  const { attendance, checkIn, checkOut, isCheckingIn, isCheckingOut, error: attendanceError } = useAttendance();

  // Check-in states
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutSearchTerm, setCheckoutSearchTerm] = useState('');

  // Debounced search terms for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCheckoutSearchTerm = useDebounce(checkoutSearchTerm, 300);

  // Set initial tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'checkout') {
      setActiveTab('checkout');
    }
  }, [searchParams]);

  // Memoized filtered data for performance
  const availableChildren = useMemo(() => {
    return children.filter(child => {
      const isAlreadyCheckedIn = attendance.some(record => 
        record.child_id === child.id && !record.checked_out_at
      );
      return !isAlreadyCheckedIn;
    });
  }, [children, attendance]);

  const filteredChildren = useMemo(() => {
    return availableChildren.filter(child =>
      `${child.first_name} ${child.last_name}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [availableChildren, debouncedSearchTerm]);

  const checkedInChildren = useMemo(() => {
    return attendance.filter(record => 
      !record.checked_out_at && 
      record.child?.first_name &&
      `${record.child.first_name} ${record.child.last_name}`.toLowerCase().includes(debouncedCheckoutSearchTerm.toLowerCase())
    );
  }, [attendance, debouncedCheckoutSearchTerm]);

  const handleCheckIn = async () => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child to check in",
        variant: "destructive",
      });
      return;
    }

    try {
      await checkIn({ 
        childId: selectedChild, 
        classId: selectedClass === 'no-class' ? undefined : selectedClass 
      });
      setSelectedChild('');
      setSelectedClass('');
      setSearchTerm('');
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in child",
        variant: "destructive",
      });
    }
  };

  const handleQRCodeScan = (data: string) => {
    try {
      const parts = data.split('|');
      const attendanceIdPart = parts.find(part => part.startsWith('ATTENDANCE:'));
      
      if (attendanceIdPart) {
        const attendanceId = attendanceIdPart.split(':')[1];
        checkOut(attendanceId);
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for checkout",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "QR Code Error",
        description: "Unable to process QR code",
        variant: "destructive",
      });
    }
  };

  // Handle errors
  if (childrenError || classesError || attendanceError) {
    return (
      <ErrorFallback 
        error={childrenError || classesError || attendanceError}
        message="Failed to load kiosk data. Please try refreshing the page."
      />
    );
  }

  if (deviceLoading || childrenLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <LoadingSpinner size="lg" text="Loading kiosk..." />
      </div>
    );
  }

  if (isSetupComplete === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <div className="bg-amber-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Settings className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
            <p className="text-sm text-gray-500 mb-4">
              System setup needed before using check-in
            </p>
            <Button className="w-full">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showDeviceSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Device Setup</h2>
              <p className="text-sm text-gray-500">Register this kiosk device</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name
                </label>
                <Input
                  placeholder="e.g., Front Desk Kiosk"
                  value={deviceName}
                  onChange={(e) => updateDeviceName(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleRegisterDevice}
                className="w-full"
                disabled={!deviceName.trim()}
              >
                Register Device
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Check-In/Out Kiosk</h1>
              <p className="text-sm text-gray-500">{deviceName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={isRegistered ? "default" : "destructive"} className="flex items-center space-x-1">
              <Wifi className="h-3 w-3" />
              <span>{isRegistered ? "Connected" : "Offline"}</span>
            </Badge>
            <div className="text-right">
              <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="checkin" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Check In</span>
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Check Out</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Check In Children</h2>
              <p className="text-gray-600">Select a child and class for check-in</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuickCheckInPanel />
              
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Check-In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <Select value={selectedChild} onValueChange={setSelectedChild}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose child" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredChildren.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.first_name} {child.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose class (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-class">No specific class</SelectItem>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      onClick={handleCheckIn} 
                      disabled={!selectedChild || isCheckingIn}
                      className="w-full"
                    >
                      {isCheckingIn ? (
                        <LoadingSpinner size="sm" text="Checking In..." />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Check In
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <LoginForm onSignUp={() => {}} />
            </div>
          </TabsContent>

          <TabsContent value="checkout" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Check Out Children</h2>
              <p className="text-gray-600">Scan QR code or search for children to check them out</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QRCodeScanner onScanComplete={handleQRCodeScan} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Manual Check-out</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search checked-in children..."
                      value={checkoutSearchTerm}
                      onChange={(e) => setCheckoutSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {checkedInChildren.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown Child'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.class?.name || 'No Class'} • 
                            Checked in: {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString() : 'Unknown'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => checkOut(record.id)}
                          disabled={isCheckingOut}
                        >
                          {isCheckingOut ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-1" />
                              Check Out
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                    
                    {checkedInChildren.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {debouncedCheckoutSearchTerm ? 'No matching children found' : 'No children checked in'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CheckInKiosk;
