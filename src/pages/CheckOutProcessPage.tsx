
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Search, Clock } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import QRCodeScanner from '@/components/qr/QRCodeScanner';

const CheckOutProcessPage = () => {
  const { toast } = useToast();
  const { attendance, checkOut, isCheckingOut } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter checked-in children for check-out
  const checkedInChildren = attendance.filter(record => 
    !record.checked_out_at && 
    record.child?.first_name &&
    `${record.child.first_name} ${record.child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Check Out Children</h1>
          <p className="text-gray-600">Scan QR code or search for children to check them out</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeScanner onScanComplete={handleQRCodeScan} />
            </CardContent>
          </Card>
          
          {/* Manual Check-out */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Manual Check-out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search checked-in children..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {checkedInChildren.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div>
                      <p className="font-medium">
                        {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown Child'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">
                          {record.class?.name || 'No Class'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Checked in: {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => checkOut(record.id)}
                      disabled={isCheckingOut}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Check Out
                    </Button>
                  </div>
                ))}
                
                {checkedInChildren.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No matching children found' : 'No children checked in'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckOutProcessPage;

