import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  ClipboardCheck,
  FileText,
  Loader2,
  Heart,
  Stethoscope,
  ShieldAlert,
  Activity,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  History
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
      const { data, error } = await (supabase.rpc as any)('get_attendance_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data;
    },
  });

  // Swapping basic detailed report for enhanced liability audit data
  const { data: detailedAttendance, isLoading: loadingDetailed } = useQuery({
    queryKey: ['detailed-attendance', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_liability_audit_report', {
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

  // Fetch medical profiles report
  const { data: medicalProfiles, isLoading: loadingMedical } = useQuery({
    queryKey: ['medical-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          child_medical_profiles (
            allergies,
            medications,
            conditions,
            emergency_notes
          )
        `);

      if (error) throw error;

      // Filter only children with medical data
      return (data || []).filter((c: any) =>
        (c.child_medical_profiles?.length > 0) ||
        (c.allergies) ||
        (c.medical_info)
      );
    },
  });

  // 1. Ratio Alerts
  const { data: ratioAlerts, isLoading: loadingRatios } = useQuery({
    queryKey: ['ratio-alerts'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_ratio_alerts', {
        p_date: format(new Date(), 'yyyy-MM-dd')
      });
      if (error) throw error;
      return data;
    },
  });

  // 2. Liability Audit
  const { data: liabilityAudit, isLoading: loadingLiability } = useQuery({
    queryKey: ['liability-audit', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_liability_audit_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd')
      });
      if (error) throw error;
      return data;
    },
  });

  // 3. Heatmap
  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['attendance-heatmap', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_attendance_heatmap', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd')
      });
      if (error) throw error;

      // Fill in missing hours
      const fullHeatmap = Array.from({ length: 15 }, (_, i) => {
        const hour = i + 6; // 6am to 8pm
        const existing = (data as any[])?.find((d: any) => d.hour_of_day === hour);
        return {
          hour_of_day: hour,
          label: format(new Date().setHours(hour, 0, 0, 0), 'ha'),
          avg_count: existing?.avg_count || 0
        };
      });
      return fullHeatmap;
    },
  });

  // 4. No-Show report
  const { data: noShowReport, isLoading: loadingNoShows } = useQuery({
    queryKey: ['no-show-report'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_no_show_report', {
        p_date: format(new Date(), 'yyyy-MM-dd')
      });
      if (error) throw error;
      return data;
    },
  });

  const handleExportCSV = () => {
    if (!detailedAttendance) return;

    const csv = [
      ['Date', 'Child Name', 'Age', 'Allergies', 'Class', 'Check-In Time', 'In By', 'In Method/Station', 'Check-Out Time', 'Out By', 'Out Method/Station', 'Duration (hours)'],
      ...detailedAttendance.map((row: any) => [
        row.attendance_date ? format(new Date(row.attendance_date), 'yyyy-MM-dd') : 'N/A',
        row.child_name,
        row.child_age || 'N/A',
        row.has_allergies ? 'YES' : 'NONE',
        row.class_name || 'N/A',
        row.checked_in_at ? format(new Date(row.checked_in_at), 'HH:mm') : 'N/A',
        row.checked_in_by_name || 'System/PIN',
        `${row.checked_in_method || 'N/A'}${row.checked_in_station ? ` (${row.checked_in_station})` : ''}`,
        row.checked_out_at ? format(new Date(row.checked_out_at), 'HH:mm') : 'N/A',
        row.checked_out_by_name || 'N/A',
        `${row.checked_out_method || 'N/A'}${row.checked_out_station ? ` (${row.checked_out_station})` : ''}`,
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
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
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
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
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
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
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
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
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
          </motion.div>
        </motion.div>

        {/* Date Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Medical
              </TabsTrigger>
              <TabsTrigger value="safety" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                Safety & Liability
              </TabsTrigger>
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
                  ) : (attendanceReport as any[]) && (attendanceReport as any[]).length > 0 ? (
                    <div className="space-y-6">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={attendanceReport as any[]}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="attendance_date"
                              tickFormatter={(value) => value ? format(new Date(value), 'MMM dd') : ''}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => value ? format(new Date(value), 'MMM dd, yyyy') : ''}
                            />
                            <Legend />
                            <Bar dataKey="total_checked_in" name="Check-Ins" fill="#3b82f6" />
                            <Bar dataKey="total_checked_out" name="Check-Outs" fill="#f97316" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
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
                          {(attendanceReport as any[]).map((row: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{row.attendance_date ? format(new Date(row.attendance_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell className="font-medium">{row.class_name || 'N/A'}</TableCell>
                              <TableCell className="text-right">{row.total_checked_in}</TableCell>
                              <TableCell className="text-right">{row.total_checked_out}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
                  ) : (detailedAttendance as any[]) && (detailedAttendance as any[]).length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Child</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Check-In (By/Via)</TableHead>
                            <TableHead>Check-Out (By/Via)</TableHead>
                            <TableHead className="text-right">Dur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(detailedAttendance as any[]).map((row: any, index: number) => (
                            <TableRow key={index} className={cn(row.has_allergies && "bg-rose-50/30")}>
                              <TableCell className="text-[10px] sm:text-xs">
                                {row.attendance_date ? format(new Date(row.attendance_date), 'MMM dd') : 'N/A'}
                              </TableCell>
                              <TableCell className="font-bold text-sm">
                                <div className="flex items-center gap-1.5">
                                  {row.child_name}
                                  {row.has_allergies && <AlertTriangle className="h-3 w-3 text-rose-500 fill-rose-500/10" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500">{row.child_age || '-'}</TableCell>
                              <TableCell className="text-xs font-medium text-slate-600 truncate max-w-[100px]">{row.class_name || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-xs font-mono">{row.checked_in_at ? format(new Date(row.checked_in_at), 'HH:mm') : 'N/A'}</div>
                                  <div className="text-[10px] text-slate-500 font-medium italic flex items-center gap-1">
                                    {row.checked_in_by_name?.split(' ')[0]}
                                    <Badge variant="outline" className={cn(
                                      "text-[8px] px-1 h-3 leading-none",
                                      row.checked_in_method === 'kiosk' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                      {row.checked_in_method || 'app'}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-xs font-mono">{row.checked_out_at ? format(new Date(row.checked_out_at), 'HH:mm') : 'N/A'}</div>
                                  <div className="text-[10px] text-slate-500 font-medium italic flex items-center gap-1">
                                    {row.checked_out_by_name?.split(' ')[0]}
                                    {row.checked_out_method && (
                                      <Badge variant="outline" className={cn(
                                        "text-[8px] px-1 h-3 leading-none",
                                        row.checked_out_method === 'kiosk' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                      )}>
                                        {row.checked_out_method}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-indigo-600">
                                {row.duration_hours ? `${row.duration_hours.toFixed(1)}h` : '-'}
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
            <TabsContent value="safety" className="space-y-6">
              {/* Ratio Alerts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      Ratio Alerts
                    </CardTitle>
                    <CardDescription>Real-time safety ratio monitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRatios ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (ratioAlerts as any[]) && (ratioAlerts as any[]).length > 0 ? (
                      <div className="space-y-4">
                        {(ratioAlerts as any[]).map((alert: any, i: number) => (
                          <div key={i} className={cn(
                            "p-3 rounded-lg border",
                            alert.violation_level === 'Critical' ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                          )}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm">{alert.class_name}</span>
                              <Badge variant={alert.violation_level === 'Critical' ? 'destructive' : 'outline'}>
                                {alert.violation_level}
                              </Badge>
                            </div>
                            <div className="mt-2 text-xs flex justify-between">
                              <span className="text-slate-500">Present / Capacity</span>
                              <span className="font-mono">{alert.current_count} / {alert.capacity}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div 
                                className={cn("h-full", alert.violation_level === 'Critical' ? "bg-red-500" : "bg-amber-500")}
                                style={{ width: `${Math.min(100, (alert.current_count / alert.capacity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">All classes within safe ratios.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Presence Heatmap */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-500" />
                      Peak Occupancy Analysis
                    </CardTitle>
                    <CardDescription>Average attendance by hour for selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmapData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="avg_count" name="Avg Children" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Liability Audit Table */}
              {/* Liability Audit Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* No-Show Alert Column */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-600">
                      <ShieldAlert className="h-5 w-5" />
                      Expected But Not Present
                    </CardTitle>
                    <CardDescription>Children assigned today who haven't checked in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      {loadingNoShows ? <Loader2 className="h-6 w-6 animate-spin mx-auto"/> : (noShowReport as any[])?.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead>Child</TableHead><TableHead>Class</TableHead><TableHead>Phone</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {(noShowReport as any[]).map((r: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{r.child_name}</TableCell>
                                <TableCell className="text-xs">{r.class_name}</TableCell>
                                <TableCell className="text-xs">{r.parent_phone || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p className="text-center text-slate-400 py-8 italic">All expected children present.</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-indigo-500" />
                      Critical Medical Alerts
                    </CardTitle>
                    <CardDescription>High-priority conditions for children currently present</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {medicalProfiles?.filter((c: any) => c.child_medical_profiles?.[0]?.allergies?.some((a: any) => a.severity === 'high')).map((c: any, i: number) => (
                        <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                          <span className="font-bold text-red-700">{c.first_name} {c.last_name}</span>
                          <Badge variant="destructive">High Allergy</Badge>
                        </div>
                      ))}
                      {(medicalProfiles as any[])?.filter((c: any) => c.child_medical_profiles?.[0]?.allergies?.some((a: any) => a.severity === 'high')).length === 0 && (
                        <p className="text-center text-slate-400 py-8 italic text-sm">No critical medical alerts for present children.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-slate-600" />
                      Liability & Custody Audit
                    </CardTitle>
                    <CardDescription>Detailed chain-of-custody for child check-in/out</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Date</TableHead>
                          <TableHead>Child</TableHead>
                          <TableHead>Check-In (By)</TableHead>
                          <TableHead>Check-Out (By)</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingLiability ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                        ) : (liabilityAudit as any[])?.map((log: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{format(new Date(log.attendance_date), 'MMM dd')}</TableCell>
                            <TableCell className="font-bold">{log.child_name}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <span className="font-semibold block">{format(new Date(log.checked_in_at), 'HH:mm')}</span>
                                <span className="text-slate-400">By: {log.checked_in_by_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.checked_out_at ? (
                                <div className="text-xs">
                                  <span className="font-semibold block">{format(new Date(log.checked_out_at), 'HH:mm')}</span>
                                  <span className="text-slate-400">By: {log.checked_out_by_name}</span>
                                </div>
                              ) : <span className="text-xs italic text-slate-400">Currently in center</span>}
                            </TableCell>
                            <TableCell>
                              {log.duration_hours ? (
                                <Badge variant="secondary" className="font-mono">
                                  {log.duration_hours.toFixed(1)}h
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {log.checked_out_at ? (
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100">Verified Exit</Badge>
                              ) : (
                                <Badge className="bg-indigo-600 animate-pulse">Present</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="medical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-indigo-600" />
                    Medical & Allergy Summary
                  </CardTitle>
                  <CardDescription>Critical health information for all children</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMedical ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : medicalProfiles && medicalProfiles.length > 0 ? (
                    <div className="space-y-4">
                      {medicalProfiles.map((child: any) => {
                        const profile = child.child_medical_profiles?.[0];
                        const allergies = profile?.allergies || [];
                        const meds = profile?.medications || [];

                        return (
                          <div key={child.id} className="p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-bold text-lg">{child.first_name} {child.last_name}</h4>
                              <div className="flex gap-2">
                                {allergies.some((a: any) => a.severity === 'high') && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" />
                                    High Alert
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Allergies</p>
                                {allergies.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {allergies.map((a: any, i: number) => (
                                      <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-100">
                                        {a.type} ({a.severity})
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-400 italic">None documented</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Medications</p>
                                {meds.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {meds.map((m: any, i: number) => (
                                      <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                                        {m.name} - {m.dosage}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-400 italic">None documented</p>
                                )}
                              </div>
                              {profile?.emergency_notes && (
                                <div className="md:col-span-2 space-y-1">
                                  <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Health Notes</p>
                                  <p className="text-slate-700 bg-slate-100/50 p-2 rounded-lg">{profile.emergency_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No critical medical records found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default EnhancedReportsPage;
