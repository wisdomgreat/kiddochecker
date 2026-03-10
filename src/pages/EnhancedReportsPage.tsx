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

  // Detailed report data
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
      const { data: attendance } = await supabase.from('attendance').select('*');
      const { count: totalChildren } = await supabase.from('children').select('*', { count: 'exact', head: true });

      const periodAttendance = attendance?.filter(a =>
        a.attendance_date >= format(dateRange.from, 'yyyy-MM-dd') &&
        a.attendance_date <= format(dateRange.to, 'yyyy-MM-dd')
      ) || [];

      return {
        totalChildren: totalChildren || 0,
        totalCheckIns: periodAttendance.filter(a => a.checked_in_at).length,
        totalCheckOuts: periodAttendance.filter(a => a.checked_out_at).length,
        currentlyPresent: attendance?.filter(a => a.checked_in_at && !a.checked_out_at).length || 0,
      };
    },
  });

  // Medical report
  const { data: medicalProfiles, isLoading: loadingMedical } = useQuery({
    queryKey: ['medical-report'],
    queryFn: async () => {
      const { data, error } = await supabase.from('children').select(`
        id, first_name, last_name, allergies, medical_info,
        child_medical_profiles (allergies, medications, conditions, emergency_notes)
      `);
      if (error) throw error;
      return (data || []).filter((c: any) =>
        c.child_medical_profiles?.length > 0 || c.allergies || c.medical_info
      );
    },
  });

  // Ratio Alerts
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

  // Heatmap
  const { data: heatmapData } = useQuery({
    queryKey: ['attendance-heatmap', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_attendance_heatmap', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd')
      });
      if (error) throw error;
      return Array.from({ length: 15 }, (_, i) => {
        const hour = i + 6;
        const existing = (data as any[])?.find((d: any) => d.hour_of_day === hour);
        return {
          hour_of_day: hour,
          label: format(new Date().setHours(hour, 0, 0, 0), 'ha'),
          avg_count: existing?.avg_count || 0
        };
      });
    },
  });

  // Terminal Security
  const { data: securityStats, isLoading: loadingSecurity } = useQuery({
    queryKey: ['terminal-security-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_terminal_security_stats');
      if (error) throw error;
      return data;
    },
  });

  // No-Show report
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
      ['Date', 'Child', 'In Time', 'In Method', 'Out Time', 'Out Method', 'Duration'],
      ...detailedAttendance.map((r: any) => [
        r.attendance_date, r.child_name,
        r.checked_in_at ? format(new Date(r.checked_in_at), 'HH:mm') : '', r.checked_in_method,
        r.checked_out_at ? format(new Date(r.checked_out_at), 'HH:mm') : '', r.checked_out_method,
        r.duration_hours?.toFixed(1) || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const setQuickDateRange = (range: 'week' | 'month') => {
    const today = new Date();
    if (range === 'week') setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
    else setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">World-Class Analytics</h1>
            <p className="text-muted-foreground">Deep insights into your organization's attendance and security</p>
          </div>
          <Button onClick={handleExportCSV} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 shadow-lg shadow-indigo-100">
            <Download className="h-4 w-4" /> Export Audit
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2"><Users className="h-4 w-4" />Registered</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-slate-800">{stats?.totalChildren}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-2"><ClipboardCheck className="h-4 w-4" />Check-Ins</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-slate-800">{stats?.totalCheckIns}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-indigo-50/80 ring-1 ring-indigo-100">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-indigo-600 flex items-center gap-2"><Activity className="h-4 w-4" />Current Presence</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-indigo-700">{stats?.currentlyPresent}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-red-600 flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Alerts (24h)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-black text-red-700">{securityStats?.alerts_last_24h || 0}</div></CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setQuickDateRange('week')} className="text-xs font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-600">This Week</Button>
            <Button variant="ghost" size="sm" onClick={() => setQuickDateRange('month')} className="text-xs font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-600">This Month</Button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg h-9 gap-2 text-xs font-medium">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(r: any) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-6">
            {['summary', 'detailed', 'security', 'medical', 'safety'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-1 pb-3 text-xs font-bold uppercase tracking-wider text-slate-500 data-[state=active]:text-indigo-600 transition-all"
              >
                {tab.replace('-', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary" className="space-y-6 outline-none">
            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg">Volume Trends</CardTitle>
                <CardDescription>Daily check-in and check-out patterns</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingAttendance ? <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div> : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceReport}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="attendance_date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), 'MMM dd')} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="total_checked_in" name="Check-Ins" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="total_checked_out" name="Check-Outs" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6 outline-none">
            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Child / Class</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Check-In</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Check-Out</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDetailed ? (
                      <TableRow><TableCell colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-500" /></TableCell></TableRow>
                    ) : detailedAttendance?.map((log: any, i: number) => (
                      <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{log.child_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.class_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-700">{format(new Date(log.checked_in_at), 'HH:mm')}</span>
                            <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 bg-indigo-50 text-indigo-600 border-indigo-100">{log.checked_in_method}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {log.checked_out_at ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-700">{format(new Date(log.checked_out_at), 'HH:mm')}</span>
                              <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 bg-slate-100 text-slate-600 border-slate-200">{log.checked_out_method}</Badge>
                            </div>
                          ) : <Badge className="bg-indigo-600 text-[10px] animate-pulse">Present</Badge>}
                        </TableCell>
                        <TableCell className="text-right pr-6 font-mono font-bold text-slate-600">
                          {log.duration_hours ? `${log.duration_hours.toFixed(1)}h` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Threat Density</CardTitle>
                  <CardDescription>Security mismatch alerts by station</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    {securityStats?.top_alert_devices ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={securityStats.top_alert_devices} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontStyle: 'bold' }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="alert_count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-300 italic">No threats detected.</div>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-600"><History className="h-5 w-5" /> Auth Forensics</CardTitle>
                  <CardDescription>Real-time terminal binding audit</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {detailedAttendance?.filter((l: any) => l.checked_in_method === 'kiosk').slice(0, 5).map((log: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Zap className="h-4 w-4" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{log.child_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{log.checked_in_station || 'Terminal Binded'} • {format(new Date(log.checked_in_at), 'HH:mm:ss')}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-100">VERIFIED</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-none shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-white/10 rounded-full backdrop-blur-xl border border-white/10 shadow-inner">
                    <ShieldCheck className="h-10 w-10 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Terminal Security Reinforcement</h3>
                    <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">Hardware identity binding is active for all terminals. {securityStats?.locked_terminals || 0} unit(s) are currently isolated. System heuristic analysis is monitoring for footprint changes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicalProfiles?.map((c: any) => (
                <Card key={c.id} className="border-slate-100 shadow-sm rounded-3xl hover:border-rose-200 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-bold">{c.first_name} {c.last_name}</CardTitle>
                      <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-rose-100 text-[9px] font-black uppercase">Critical</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                      <p className="text-[9px] font-black uppercase text-rose-600 mb-1">Allergies</p>
                      <p className="text-xs font-bold text-slate-700">{c.child_medical_profiles?.[0]?.allergies?.map((a: any) => a.type).join(', ') || c.allergies}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-slate-100 shadow-sm rounded-3xl outline-none">
                <CardHeader><CardTitle className="text-rose-600 flex items-center gap-2"><Zap className="h-5 w-5" /> No-Show Radar</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead className="text-[10px] pl-6">Child</TableHead><TableHead className="text-[10px] pr-6 text-right">Class</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {noShowReport?.map((r: any, i: number) => (
                        <TableRow key={i}><TableCell className="text-xs font-bold pl-6">{r.child_name}</TableCell><TableCell className="text-[10px] text-right pr-6">{r.class_name}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-3xl overflow-hidden outline-none">
                <CardHeader><CardTitle className="text-amber-600 flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Center Capacity Heatmap</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapData}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} />
                        <Bar dataKey="avg_count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default EnhancedReportsPage;
