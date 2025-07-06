
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, BarChart, Users, Clock, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: attendanceReport, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance-report', dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: summaryStats } = useQuery({
    queryKey: ['summary-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

      const [todayResult, weekResult, totalChildrenResult] = await Promise.all([
        supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('attendance_date', today)
          .not('checked_in_at', 'is', null),
        
        supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .gte('attendance_date', weekStart)
          .lte('attendance_date', weekEnd)
          .not('checked_in_at', 'is', null),
        
        supabase
          .from('children')
          .select('*', { count: 'exact' })
      ]);

      return {
        todayAttendance: todayResult.count || 0,
        weekAttendance: weekResult.count || 0,
        totalChildren: totalChildrenResult.count || 0
      };
    }
  });

  const handleExportReport = () => {
    if (!attendanceReport) return;

    const csvContent = [
      ['Date', 'Child Name', 'Class', 'Check-in Time', 'Check-out Time', 'Duration (Hours)'],
      ...attendanceReport.map((record: any) => [
        record.attendance_date,
        record.child_name,
        record.class_name || 'No Class',
        record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm:ss') : '',
        record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm:ss') : '',
        record.duration_hours || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <Button onClick={handleExportReport} disabled={!attendanceReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.todayAttendance || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week's Attendance</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.weekAttendance || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalChildren || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
            <TabsTrigger value="summary">Summary Analytics</TabsTrigger>
            <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Report</CardTitle>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <span>to</span>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <div className="text-center py-8">Loading report data...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Child Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Class</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Check-in</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Check-out</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceReport?.map((record: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-300 px-4 py-2">
                                {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{record.child_name}</td>
                              <td className="border border-gray-300 px-4 py-2">{record.class_name || 'No Class'}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                {record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm:ss') : '-'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm:ss') : '-'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {record.duration_hours ? `${Number(record.duration_hours).toFixed(2)}h` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(!attendanceReport || attendanceReport.length === 0) && (
                      <p className="text-center py-8 text-gray-500">
                        No attendance records found for the selected date range.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Attendance Trends</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Average daily attendance and patterns over time.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Today's Rate:</span>
                        <span className="font-medium">
                          {summaryStats ? `${Math.round((summaryStats.todayAttendance / (summaryStats.totalChildren || 1)) * 100)}%` : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Average:</span>
                        <span className="font-medium">
                          {summaryStats ? `${Math.round((summaryStats.weekAttendance / (summaryStats.totalChildren * 7 || 1)) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">System Usage</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Overall system statistics and usage patterns.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Registered Children:</span>
                        <span className="font-medium">{summaryStats?.totalChildren || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active This Week:</span>
                        <span className="font-medium">{summaryStats?.weekAttendance || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Create custom reports based on specific criteria and date ranges.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-24 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span>Class-specific Reports</span>
                    </Button>
                    
                    <Button variant="outline" className="h-24 flex-col">
                      <BarChart className="h-6 w-6 mb-2" />
                      <span>Monthly Summary</span>
                    </Button>
                    
                    <Button variant="outline" className="h-24 flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      <span>Parent Activity Report</span>
                    </Button>
                    
                    <Button variant="outline" className="h-24 flex-col">
                      <Clock className="h-6 w-6 mb-2" />
                      <span>Peak Hours Analysis</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
