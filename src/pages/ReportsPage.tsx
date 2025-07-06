
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart3, Download, Calendar as CalendarIcon, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  const [reportType, setReportType] = useState('attendance');

  const { data: attendanceReport } = useQuery({
    queryKey: ['attendanceReport', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data;
    }
  });

  const generateReport = () => {
    // Report generation logic
    console.log('Generating report for:', reportType, dateRange);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <Button onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{attendanceReport?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {attendanceReport?.reduce((acc, record) => acc + (record.duration_hours || 0), 0).toFixed(1) || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {attendanceReport ? new Set(attendanceReport.map(r => r.child_name)).size : 0}
                  </p>
                  <p className="text-sm text-gray-600">Unique Children</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {attendanceReport ? new Set(attendanceReport.map(r => r.attendance_date)).size : 0}
                  </p>
                  <p className="text-sm text-gray-600">Days Covered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 items-center">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attendance">Attendance Report</SelectItem>
              <SelectItem value="duration">Duration Report</SelectItem>
              <SelectItem value="summary">Summary Report</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs value="detailed" className="w-full">
          <TabsList>
            <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="charts">Visual Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Attendance Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceReport?.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.child_name}</p>
                        <p className="text-sm text-gray-600">
                          {record.class_name} • {format(new Date(record.attendance_date), 'PPP')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          In: {record.check_in_time ? format(new Date(record.check_in_time), 'p') : 'N/A'}
                        </p>
                        <p className="text-sm">
                          Out: {record.check_out_time ? format(new Date(record.check_out_time), 'p') : 'N/A'}
                        </p>
                        <p className="text-sm font-medium">
                          Duration: {record.duration_hours ? `${record.duration_hours.toFixed(1)}h` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Summary Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Summary analytics and insights coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <Card>
              <CardHeader>
                <CardTitle>Visual Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Charts and visual analytics coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
