import React, { useState } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  ClipboardCheck,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const EnhancedReportsPage = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Fetch attendance report data
  const { data: attendanceReport, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-report', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data;
    },
  });

  // Fetch detailed attendance report
  const { data: detailedAttendance, isLoading: loadingDetailed } = useQuery({
    queryKey: ['detailed-attendance', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data;
    },
  });

  // Fetch summary statistics
  const { data: stats } = useQuery({
    queryKey: ['report-stats', dateRange],
    queryFn: async () => {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*', { count: 'exact' })
        .gte('attendance_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('attendance_date', format(dateRange.to, 'yyyy-MM-dd'));

      const { data: children } = await supabase
        .from('children')
        .select('*', { count: 'exact' });

      const totalCheckIns = attendance?.filter(a => a.checked_in_at).length || 0;
      const totalCheckOuts = attendance?.filter(a => a.checked_out_at).length || 0;
      const currentlyPresent = attendance?.filter(a => a.checked_in_at && !a.checked_out_at).length || 0;

      return {
        totalChildren: children?.length || 0,
        totalCheckIns,
        totalCheckOuts,
        currentlyPresent,
      };
    },
  });

  const handleExportCSV = () => {
    if (!detailedAttendance) return;

    const csv = [
      ['Date', 'Child Name', 'Class', 'Check-In Time', 'Check-Out Time', 'Duration (hours)'],
      ...detailedAttendance.map((row: any) => [
        format(new Date(row.attendance_date), 'yyyy-MM-dd'),
        row.child_name,
        row.class_name || 'N/A',
        row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm') : 'N/A',
        row.check_out_time ? format(new Date(row.check_out_time), 'HH:mm') : 'N/A',
        row.duration_hours?.toFixed(2) || 'N/A',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: "Success",
      description: "Report exported successfully",
    });
  };

  const setQuickDateRange = (range: 'week' | 'month') => {
    const today = new Date();
    if (range === 'week') {
      setDateRange({
        from: startOfWeek(today),
        to: endOfWeek(today),
      });
    } else {
      setDateRange({
        from: startOfMonth(today),
        to: endOfMonth(today),
      });
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive attendance and activity reports</p>
          </div>
          <Button onClick={handleExportCSV} disabled={!detailedAttendance}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalChildren || 0}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-green-500" />
                Total Check-Ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCheckIns || 0}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Total Check-Outs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCheckOuts || 0}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                Currently Present
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.currentlyPresent || 0}</div>
              <p className="text-xs text-muted-foreground">Right now</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date Range
            </CardTitle>
            <CardDescription>Select the date range for your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('week')}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('month')}
              >
                This Month
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary Report</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary by Class</CardTitle>
                <CardDescription>Overview of attendance statistics per class</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAttendance ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : attendanceReport && attendanceReport.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Check-Ins</TableHead>
                        <TableHead className="text-right">Check-Outs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceReport.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{format(new Date(row.attendance_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{row.class_name || 'N/A'}</TableCell>
                          <TableCell className="text-right">{row.total_checked_in}</TableCell>
                          <TableCell className="text-right">{row.total_checked_out}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance data for selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Attendance Report</CardTitle>
                <CardDescription>Individual check-in and check-out records</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDetailed ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : detailedAttendance && detailedAttendance.length > 0 ? (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Child Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Check-In</TableHead>
                          <TableHead>Check-Out</TableHead>
                          <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailedAttendance.map((row: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(row.attendance_date), 'MMM dd')}</TableCell>
                            <TableCell className="font-medium">{row.child_name}</TableCell>
                            <TableCell>{row.class_name || 'N/A'}</TableCell>
                            <TableCell>
                              {row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {row.check_out_time ? format(new Date(row.check_out_time), 'HH:mm') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.duration_hours ? `${row.duration_hours.toFixed(1)}h` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No detailed attendance records for selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default EnhancedReportsPage;
