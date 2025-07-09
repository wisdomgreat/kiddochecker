
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Search, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import { supabase } from '@/integrations/supabase/client';

const CheckOutStation = () => {
  const { toast } = useToast();
  const { attendance, checkOut, isCheckingOut, refetch } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showBackupVerification, setShowBackupVerification] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  // Filter checked-in children for check-out
  const checkedInChildren = attendance.filter(record => 
    !record.checked_out_at && 
    record.child?.first_name &&
    (searchTerm === '' || 
     `${record.child.first_name} ${record.child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Set up real-time subscription for attendance changes
  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('Real-time attendance update:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleQRCodeScan = (data: string) => {
    try {
      const parts = data.split('|');
      const attendanceIdPart = parts.find(part => part.startsWith('ATTENDANCE:'));
      
      if (attendanceIdPart) {
        const attendanceId = attendanceIdPart.split(':')[1];
        handleCheckOut(attendanceId);
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

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await checkOut(attendanceId);
      toast({
        title: "Check-out Successful",
        description: "Child has been checked out successfully",
      });
      setSearchTerm('');
    } catch (error) {
      toast({
        title: "Check-out Failed",
        description: "Please try again or use backup verification",
        variant: "destructive",
      });
    }
  };

  const handleBackupVerification = async () => {
    if (!phoneNumber || !selectedChild) {
      toast({
        title: "Missing Information",
        description: "Please provide phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verify parent by phone number
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phoneNumber.replace(/\D/g, ''));

      if (!profiles || profiles.length === 0) {
        throw new Error("Parent not found with this phone number");
      }

      // Check if this parent is authorized for this child
      const { data: children } = await supabase
        .from('children')
        .select('*')
        .eq('id', selectedChild.child_id)
        .eq('parent_id', profiles[0].id);

      if (!children || children.length === 0) {
        throw new Error("You are not authorized to pick up this child");
      }

      await handleCheckOut(selectedChild.id);
      setShowBackupVerification(false);
      setSelectedChild(null);
      setPhoneNumber('');
      setSecurityAnswer('');
      
      toast({
        title: "Backup Verification Successful",
        description: "Child has been checked out using backup verification",
      });

    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Unable to verify parent identity",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Child Check-Out Station</h1>
          <p className="text-gray-600">Scan QR code or search for children to check them out safely</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* QR Code Scanner */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <QrCode className="h-5 w-5 mr-2 text-blue-600" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeScanner onScanComplete={handleQRCodeScan} />
            </CardContent>
          </Card>
          
          {/* Manual Search */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Search className="h-5 w-5 mr-2 text-green-600" />
                Search Children
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by child name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checked-in Children List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-purple-600" />
                Currently Checked In ({checkedInChildren.length})
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Live Updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {checkedInChildren.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">
                          {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown Child'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {record.class?.name || 'No Class'}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString() : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleCheckOut(record.id)}
                      disabled={isCheckingOut}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Check Out
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedChild(record);
                        setShowBackupVerification(true);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Backup
                    </Button>
                  </div>
                </div>
              ))}
              
              {checkedInChildren.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  {searchTerm ? 'No matching children found' : 'No children currently checked in'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backup Verification Modal */}
        {showBackupVerification && selectedChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Backup Verification</CardTitle>
                <p className="text-center text-sm text-gray-600">
                  Verifying pickup for {selectedChild.child?.first_name} {selectedChild.child?.last_name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter parent's phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleBackupVerification}
                    disabled={!phoneNumber}
                    className="flex-1"
                  >
                    Verify & Check Out
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBackupVerification(false);
                      setSelectedChild(null);
                      setPhoneNumber('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckOutStation;
