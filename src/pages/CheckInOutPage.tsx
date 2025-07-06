
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, QrCode, Users, AlertCircle, Printer, Monitor } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAttendance } from '@/hooks/useAttendance';
import { useChildren } from '@/hooks/useChildren';
import { useQRCodes } from '@/hooks/useQRCodes';
import { useDevices } from '@/hooks/useDevices';
import { useToast } from '@/hooks/use-toast';

const CheckInOutPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const { toast } = useToast();

  const { attendance, checkIn, checkOut, isCheckingIn, isCheckingOut } = useAttendance();
  const { children } = useChildren();
  const { qrCodes, generateQRCode, isGenerating } = useQRCodes();
  const { devices, registerDevice, isRegistering } = useDevices();

  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name),
          classes (name)
        `)
        .eq('attendance_date', today);
      
      if (error) throw error;
      return data;
    }
  });

  const handleCheckIn = () => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child to check in",
        variant: "destructive",
      });
      return;
    }
    checkIn({ childId: selectedChild });
    setSelectedChild('');
  };

  const handleCheckOut = (attendanceId: string) => {
    checkOut(attendanceId);
  };

  const handleGenerateQR = () => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child to generate QR code",
        variant: "destructive",
      });
      return;
    }
    generateQRCode(selectedChild);
  };

  const handleRegisterDevice = () => {
    if (!deviceName) {
      toast({
        title: "Error",
        description: "Please enter a device name",
        variant: "destructive",
      });
      return;
    }

    const deviceId = `device_${Date.now()}`;
    registerDevice({
      device_id: deviceId,
      name: deviceName,
      type: 'check_in_kiosk',
      location: deviceLocation
    });
    
    setDeviceName('');
    setDeviceLocation('');
  };

  const handlePrintQR = (qrData: string) => {
    // Open a new window with the QR code for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Print</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
              .qr-container { margin: 20px auto; }
              .qr-code { font-family: monospace; font-size: 12px; word-break: break-all; border: 2px solid #000; padding: 10px; }
            </style>
          </head>
          <body>
            <h2>Child Check-In QR Code</h2>
            <div class="qr-container">
              <div class="qr-code">${qrData}</div>
              <p>Scan this code for check-in</p>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Check-In/Check-Out Management</h1>
          <Button onClick={() => window.open('/check-in-kiosk', '_blank')}>
            <QrCode className="h-4 w-4 mr-2" />
            Open Kiosk Mode
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {todayAttendance?.filter(a => a.checked_in_at && !a.checked_out_at).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Currently Present</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {todayAttendance?.filter(a => a.checked_in_at).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Check-ins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {todayAttendance?.filter(a => a.checked_out_at).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Check-outs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {todayAttendance?.filter(a => a.checked_in_at && !a.checked_out_at).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Not Checked Out</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Today's Attendance</TabsTrigger>
            <TabsTrigger value="checkin">Manual Check-In</TabsTrigger>
            <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
            <TabsTrigger value="devices">Device Management</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading attendance data...</div>
                ) : (
                  <div className="space-y-4">
                    {todayAttendance?.map((attendance) => (
                      <div key={attendance.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {attendance.children?.first_name} {attendance.children?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Class: {attendance.classes?.name || 'No class assigned'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm">
                              Check-in: {attendance.checked_in_at ? new Date(attendance.checked_in_at).toLocaleTimeString() : 'Not checked in'}
                            </p>
                            <p className="text-sm">
                              Check-out: {attendance.checked_out_at ? new Date(attendance.checked_out_at).toLocaleTimeString() : 'Not checked out'}
                            </p>
                          </div>
                          {attendance.checked_in_at && !attendance.checked_out_at && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCheckOut(attendance.id)}
                              disabled={isCheckingOut}
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!todayAttendance || todayAttendance.length === 0) && (
                      <p className="text-center py-8 text-gray-500">No attendance records for today.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin">
            <Card>
              <CardHeader>
                <CardTitle>Manual Check-In</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Child</label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a child...</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleCheckIn} disabled={!selectedChild || isCheckingIn}>
                  {isCheckingIn ? 'Checking In...' : 'Check In Child'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qrcodes">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Select Child for QR Code</label>
                    <select
                      value={selectedChild}
                      onChange={(e) => setSelectedChild(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a child...</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.first_name} {child.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleGenerateQR} disabled={!selectedChild || isGenerating}>
                    <QrCode className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {qrCodes.map((qr) => (
                    <div key={qr.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">
                            {qr.child?.first_name} {qr.child?.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(qr.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintQR(qr.qr_data)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                      <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                        {qr.qr_data}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Device Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Device Name</label>
                    <Input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="e.g., Front Desk Kiosk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                    <Input
                      value={deviceLocation}
                      onChange={(e) => setDeviceLocation(e.target.value)}
                      placeholder="e.g., Main Entrance"
                    />
                  </div>
                </div>
                <Button onClick={handleRegisterDevice} disabled={!deviceName || isRegistering}>
                  <Monitor className="h-4 w-4 mr-2" />
                  {isRegistering ? 'Registering...' : 'Register Device'}
                </Button>

                <div className="mt-6">
                  <h3 className="font-medium mb-4">Registered Devices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.map((device) => (
                      <div key={device.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{device.name}</h4>
                            <p className="text-sm text-gray-600">Type: {device.type}</p>
                            {device.location && (
                              <p className="text-sm text-gray-600">Location: {device.location}</p>
                            )}
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full" title="Online"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Detailed attendance history and reporting features.</p>
                <Button className="mt-4" onClick={() => setActiveTab('overview')}>
                  View Today's Records
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CheckInOutPage;
