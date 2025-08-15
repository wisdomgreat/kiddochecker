
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Search, Clock, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import QRCodeScanner from '@/components/qr/QRCodeScanner';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  allergies?: string;
  medical_info?: string;
  parent_name?: string;
  parent_phone?: string;
}

interface AttendanceRecord {
  id: string;
  child_id: string;
  checked_in_at: string;
  checked_out_at?: string;
  class_id?: string;
  child?: Child;
  class?: { name: string };
}

const EnhancedCheckInSystem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch all children
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select(`
          *,
          profiles!parent_id (
            first_name,
            last_name,
            phone
          )
        `)
        .order('first_name');
      
      if (error) throw error;
      
      return (data || []).map(child => ({
        ...child,
        parent_name: child.profiles ? `${child.profiles.first_name} ${child.profiles.last_name}` : 'Unknown',
        parent_phone: child.profiles?.phone || 'N/A'
      }));
    }
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch today's attendance
  const { data: todaysAttendance = [], refetch: refetchAttendance } = useQuery({
    queryKey: ['todays-attendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (
            id,
            first_name,
            last_name,
            age,
            allergies,
            medical_info
          ),
          classes (
            name
          )
        `)
        .eq('attendance_date', today)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000 // Refetch every 5 seconds for real-time updates
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ childId, classId }: { childId: string; classId?: string }) => {
      const { data, error } = await supabase.rpc('checkin_child' as any, {
        p_child_id: childId,
        p_class_id: classId || null,
        p_checked_in_by: null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const child = children.find(c => c.id === variables.childId);
      toast({
        title: "Check-in Successful",
        description: `${child?.first_name} has been checked in successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['todays-attendance'] });
      setSelectedChild(null);
      setSearchTerm('');
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in child",
        variant: "destructive",
      });
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase.rpc('checkout_child' as any, {
        p_attendance_id: attendanceId,
        p_checked_out_by: null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, attendanceId) => {
      const record = todaysAttendance.find(r => r.id === attendanceId);
      toast({
        title: "Check-out Successful",
        description: `${record?.children.first_name} has been checked out successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['todays-attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out child",
        variant: "destructive",
      });
    }
  });

  // Filter children based on search and attendance status
  const availableChildren = children
    .filter(child => 
      !todaysAttendance.some(record => 
        record.child_id === child.id && !record.checked_out_at
      )
    )
    .filter(child => 
      searchTerm === '' || 
      `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const checkedInChildren = todaysAttendance.filter(record => !record.checked_out_at);
  const checkedOutChildren = todaysAttendance.filter(record => record.checked_out_at);

  const handleQRCodeScan = (data: string) => {
    try {
      const parts = data.split('|');
      const childIdPart = parts.find(part => part.startsWith('CHILD:'));
      
      if (childIdPart) {
        const childId = childIdPart.split(':')[1];
        const child = children.find(c => c.id === childId);
        
        if (child) {
          const isCheckedIn = todaysAttendance.some(record => 
            record.child_id === childId && !record.checked_out_at
          );
          
          if (isCheckedIn) {
            const attendanceRecord = todaysAttendance.find(record => 
              record.child_id === childId && !record.checked_out_at
            );
            if (attendanceRecord) {
              checkOutMutation.mutate(attendanceRecord.id);
            }
          } else {
            setSelectedChild(child);
          }
        } else {
          toast({
            title: "Child Not Found",
            description: "This QR code is not associated with any child",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for check-in/out",
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

  const handleCheckIn = () => {
    if (selectedChild) {
      checkInMutation.mutate({
        childId: selectedChild.id,
        classId: selectedClass || undefined
      });
    }
  };

  // Real-time stats
  const stats = {
    totalCheckedIn: checkedInChildren.length,
    totalCheckedOut: checkedOutChildren.length,
    totalToday: todaysAttendance.length,
    peakTime: todaysAttendance.length > 0 ? 
      todaysAttendance.reduce((peak, record) => {
        const hour = new Date(record.checked_in_at).getHours();
        return hour;
      }, 0) : 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Checked In</p>
                <p className="text-2xl font-bold">{stats.totalCheckedIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Checked Out</p>
                <p className="text-2xl font-bold">{stats.totalCheckedOut}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold">{stats.totalToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold">{availableChildren.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <p className="text-sm text-gray-600 mt-2">
              Scan a child's QR code to quickly check them in or out
            </p>
          </CardContent>
        </Card>

        {/* Manual Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Manual Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search for a child..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {selectedChild && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium">{selectedChild.first_name} {selectedChild.last_name}</h4>
                <p className="text-sm text-gray-600">Age: {selectedChild.age}</p>
                {selectedChild.allergies && (
                  <p className="text-sm text-red-600">⚠️ Allergies: {selectedChild.allergies}</p>
                )}
                
                <div className="mt-3 space-y-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a class (optional)</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCheckIn}
                      disabled={checkInMutation.isPending}
                      className="flex-1"
                    >
                      {checkInMutation.isPending ? "Checking In..." : "Check In"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedChild(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {childrenLoading ? (
                <div className="text-center py-4">Loading children...</div>
              ) : availableChildren.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm ? 'No matching children found' : 'All children are checked in'}
                </div>
              ) : (
                availableChildren.map(child => (
                  <div 
                    key={child.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedChild(child)}
                  >
                    <div>
                      <p className="font-medium">{child.first_name} {child.last_name}</p>
                      <p className="text-sm text-gray-600">Age: {child.age} • Parent: {child.parent_name}</p>
                      {child.allergies && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Allergies: {child.allergies}
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Checked In */}
      <Card>
        <CardHeader>
          <CardTitle>Currently Checked In ({checkedInChildren.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkedInChildren.map(record => (
              <div key={record.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      {record.children.first_name} {record.children.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">Age: {record.children.age}</p>
                    {record.classes && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {record.classes.name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => checkOutMutation.mutate(record.id)}
                    disabled={checkOutMutation.isPending}
                  >
                    Check Out
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Checked in: {new Date(record.checked_in_at).toLocaleTimeString()}
                </p>
                {record.children.allergies && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ {record.children.allergies}
                  </p>
                )}
              </div>
            ))}
          </div>
          {checkedInChildren.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No children currently checked in
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCheckInSystem;
