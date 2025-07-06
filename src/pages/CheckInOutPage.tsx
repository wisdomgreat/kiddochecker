
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, QrCode, Users, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CheckInOutPage = () => {
  const [activeTab, setActiveTab] = useState('check-in');

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
          <TabsList>
            <TabsTrigger value="check-in">Today's Check-ins</TabsTrigger>
            <TabsTrigger value="history">Attendance History</TabsTrigger>
          </TabsList>

          <TabsContent value="check-in">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
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
                        <div className="text-right">
                          <p className="text-sm">
                            Check-in: {attendance.checked_in_at ? new Date(attendance.checked_in_at).toLocaleTimeString() : 'Not checked in'}
                          </p>
                          <p className="text-sm">
                            Check-out: {attendance.checked_out_at ? new Date(attendance.checked_out_at).toLocaleTimeString() : 'Not checked out'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Attendance history and reporting features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CheckInOutPage;
