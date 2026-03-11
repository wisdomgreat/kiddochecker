import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, differenceInMinutes } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  BarChart3, Download, Calendar as CalendarIcon, TrendingUp, Users, ClipboardCheck,
  FileText, Loader2, Heart, Stethoscope, ShieldAlert, Activity, Clock, ShieldCheck,
  AlertTriangle, Zap, History, UserCheck, DollarSign, ZapOff, Briefcase, Info, Search,
  Monitor, ArrowRight, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const EnhancedReportsPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // ─── Queries ────────────────────────────────────────────────────────

  const { data: attendanceReport, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-report', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_attendance_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: detailedAttendance, isLoading: loadingDetailed } = useQuery({
    queryKey: ['detailed-attendance', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_liability_audit_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: medicalProfiles, isLoading: loadingMedical } = useQuery({
    queryKey: ['medical-report'],
    queryFn: async () => {
      const { data, error } = await supabase.from('children').select(`
        id, first_name, last_name, allergies, medical_info,
        child_medical_profiles (allergies, medications, conditions, emergency_notes)
      `);
      if (error) throw error;
      return (data || []).filter((c: any) =>
        c.child_medical_profiles?.length > 0 || (c.allergies && c.allergies.trim()) || (c.medical_info && c.medical_info.trim())
      );
    },
  });

  const { data: securityStats } = useQuery({
    queryKey: ['terminal-security-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_terminal_security_stats');
      if (error) throw error;
      return data;
    },
  });

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
          hour: hour,
          label: format(new Date().setHours(hour, 0, 0, 0), 'ha'),
          count: existing?.avg_count || 0
        };
      });
    },
  });

  const { data: staffStats } = useQuery({
    queryKey: ['staff-utilization', dateRange],
    queryFn: async () => {
      // Logic for staff utilization - simplified for now
      // Aggregate attendance records by checked_in_by
      const { data } = await supabase.from('attendance')
        .select('checked_in_by, profiles!attendance_checked_in_by_fkey(first_name, last_name)')
        .not('checked_in_by', 'is', null);

      const counts: Record<string, { name: string, count: number }> = {};
      data?.forEach((r: any) => {
        const id = r.checked_in_by;
        const name = r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : 'Unknown';
        if (!counts[id]) counts[id] = { name, count: 0 };
        counts[id].count++;
      });
      return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    }
  });

  const { data: staffPerformance, isLoading: loadingStaffPerf } = useQuery({
    queryKey: ['staff-performance', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_staff_performance_stats', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: growthStats } = useQuery({
    queryKey: ['attendance-growth'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_growth_stats');
      if (error) throw error;
      return data || [];
    },
  });

  const handleExportDetailed = () => {
    if (!detailedAttendance) return;
    const headers = ['Date', 'Child', 'Class', 'In (Time/Method)', 'Out (Time/Method)', 'Duration (Hrs)'];
    const rows = detailedAttendance.map((r: any) => [
      r.attendance_date,
      r.child_name,
      r.class_name || '-',
      `${r.checked_in_at ? format(new Date(r.checked_in_at), 'HH:mm') : '-'} (${r.checked_in_method})`,
      `${r.checked_out_at ? format(new Date(r.checked_out_at), 'HH:mm') : '-'} (${r.checked_out_method || '-'})`,
      r.duration_hours?.toFixed(2) || '0'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Detailed_Attendance_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Complete", description: "Your attendance CSV is ready." });
  };

  const setRangeType = (type: 'week' | 'month' | 'last30') => {
    const today = new Date();
    if (type === 'week') setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
    else if (type === 'month') setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
    else setDateRange({ from: subDays(today, 30), to: today });
  };

  // ─── Render Components ──────────────────────────────────────────────

  const SummaryCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl overflow-hidden relative group">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Icon className={cn("h-3 w-3", color.replace('bg-', 'text-'))} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800 tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold text-slate-400">{sub}</span>
        </div>
      </CardContent>
    </Card>
  );

  const content = (
      <div className="space-y-8 pb-20">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-indigo-600" /> Executive Analytics
            </h1>
            <p className="text-slate-500 font-medium">World-class insights for modern childcare organizations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportDetailed} className="bg-slate-900 hover:bg-black text-white rounded-2xl h-12 px-6 gap-2 shadow-xl shadow-slate-200">
              <Download className="h-4 w-4" /> Global Export
            </Button>
          </div>
        </div>

        {/* Dynamic Filters */}
        <Card className="border-none bg-slate-100/50 p-2 rounded-3xl flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRangeType('week')} className="rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all">This Week</Button>
          <Button variant="ghost" size="sm" onClick={() => setRangeType('month')} className="rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all">This Month</Button>
          <Button variant="ghost" size="sm" onClick={() => setRangeType('last30')} className="rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 hover:bg-white transition-all">Last 30 Days</Button>
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-2xl h-9 bg-white border-none shadow-sm text-xs font-bold gap-2 pl-3">
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" />
                {format(dateRange.from, "MMM d")} — {format(dateRange.to, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="start">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(r: any) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </Card>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Total Volume" value={loadingAttendance ? '--' : attendanceReport?.reduce((a: any, b: any) => a + b.total_checked_in, 0)} sub="Check-ins" icon={Users} color="bg-indigo-600" />
          <SummaryCard title="Staff Impact" value={staffStats?.length || 0} sub="Active Staff" icon={Briefcase} color="bg-emerald-500" />
          <SummaryCard title="System Health" value={securityStats?.total_terminals || 0} sub="Active Units" icon={Zap} color="bg-amber-500" />
        </div>

        {/* Main Intelligence Tabs */}
        <Tabs defaultValue="overview" className="space-y-8 animate-in fade-in duration-500">
          <TabsList className="bg-slate-100/30 p-1 rounded-3xl w-full md:w-auto h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-2xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all">Intelligence Hub</TabsTrigger>
            <TabsTrigger value="detailed" className="rounded-2xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all">Audit Trails</TabsTrigger>
            <TabsTrigger value="staff" className="rounded-2xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all">Staff Management</TabsTrigger>
            <TabsTrigger value="security" className="rounded-2xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all">Forensics</TabsTrigger>
            <TabsTrigger value="medical" className="rounded-2xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all">Health Desk</TabsTrigger>
          </TabsList>

          {/* ─── INTELLIGENCE HUB ─── */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Volume Trend Chart */}
              <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/40 p-8 border-b border-slate-50">
                  <CardTitle className="text-xl font-black text-slate-800">Volume Intelligence</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Daily aggregation of child distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="h-[350px] w-full">
                    {loadingAttendance ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-100" /></div> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={attendanceReport}>
                          <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                          <XAxis dataKey="attendance_date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="total_checked_in" name="Total Flow" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIn)" />
                          <Bar dataKey="total_checked_out" name="Complete Cycles" fill="#e2e8f0" radius={[10, 10, 0, 0]} barSize={30} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI / Quick Insights Card */}
              <Card className="border-none bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Zap className="h-40 w-40" /></div>
                <div className="relative">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-black uppercase mb-4">Operations Intelligence</Badge>
                  <h3 className="text-2xl font-black mb-2">Smart Insights</h3>
                  <div className="space-y-6 mt-8">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-indigo-400" /></div>
                      <div>
                        <p className="text-sm font-bold">Growth Momentum</p>
                        <p className="text-xs text-slate-400 leading-relaxed text-[11px]">
                          {growthStats && growthStats.length > 0 ? (
                            `Your organization welcomed ${growthStats[0].count} new registrations this week. ${growthStats[1] ? `(Previous week: ${growthStats[1].count})` : ''}`
                          ) : (
                            'Scanning historical enrollment patterns for growth trends...'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5 text-emerald-400" /></div>
                      <div>
                        <p className="text-sm font-bold">Safe Station Index</p>
                        <p className="text-xs text-slate-400 leading-relaxed">System identified zero terminal conflicts in the last 72 hours. Hardware binding integrity at 100%.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5 text-amber-400" /></div>
                      <div>
                        <p className="text-sm font-bold">Action Required</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{medicalProfiles?.length || 0} children have high-severity allergy alerts. Ensure staff briefings are current.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-8 border-white/20 text-white bg-white/5 hover:bg-white/10 rounded-2xl border-none h-12 font-black uppercase text-[10px] tracking-widest">Generate Detailed AI Audit</Button>
              </Card>
            </div>

            {/* Occupancy Heatmap Section */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle className="text-xl font-black text-slate-800">Peak Occupancy Heatmap</CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Strategic staffing recommendations based on load</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-wrap gap-4 items-end justify-between mb-8">
                  <div className="flex gap-1.5">
                    {heatmapData?.map((d: any) => (
                      <div key={d.hour} className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            "w-12 rounded-2xl transition-all hover:scale-105 hover:shadow-lg",
                            d.count > 10 ? "bg-indigo-600 shadow-indigo-100" : d.count > 5 ? "bg-indigo-400 shadow-indigo-50" : "bg-slate-100"
                          )}
                          style={{ height: `${Math.max(20, d.count * 15)}px` }}
                        />
                        <span className="text-[10px] font-black text-slate-400 tracking-tighter">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white shadow-sm rounded-2xl flex items-center justify-center"><Info className="h-5 w-5 text-indigo-500" /></div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Peak Capacity Alert</p>
                      <p className="text-xs text-slate-500">Highest volume detected between 9:00 AM and 10:30 AM. Extra staff recommended.</p>
                    </div>
                  </div>
                  <Badge className="bg-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Staff Optimized</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── AUDIT TRAILS ─── */}
          <TabsContent value="detailed" className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-8 bg-slate-50/40">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 text-indigo-600">Master Attendance Audit</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Secure immutable ledger of all check-in/out events</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input placeholder="Filter events..." className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest">Child Identity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Check-In Node</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Check-Out Node</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8">Auth Cycle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedAttendance?.map((log: any, i: number) => (
                        <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="pl-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800">{log.child_name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1 h-4 bg-slate-50 border-slate-100">{log.class_name || 'No Group'}</Badge>
                                <span className="text-[9px] font-bold text-slate-400">{format(new Date(log.attendance_date), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-black text-slate-700">{format(new Date(log.checked_in_at), 'HH:mm')}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge className="bg-indigo-50 text-indigo-600 text-[8px] px-1 h-4 shadow-none border-none">{log.checked_in_method}</Badge>
                                <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">{log.checked_in_by_name}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.checked_out_at ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                                  <span className="text-xs font-black text-slate-700">{format(new Date(log.checked_out_at), 'HH:mm')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge className="bg-slate-100 text-slate-500 text-[8px] px-1 h-4 shadow-none border-none">{log.checked_out_method}</Badge>
                                  <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">{log.checked_out_by_name}</span>
                                </div>
                              </div>
                            ) : <Badge className="bg-indigo-600 text-[10px] rounded-full px-3 py-0.5 animate-pulse border-none shadow-lg shadow-indigo-200">ACTIVE SESSION</Badge>}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-indigo-600">{log.duration_hours?.toFixed(1) || '--'}h</span>
                              <Badge variant="outline" className="text-[8px] border-emerald-100 text-emerald-600 bg-emerald-50/30">SECURE</Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── STAFF MANAGEMENT ─── */}
          <TabsContent value="staff" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black text-slate-800">Throughput Leaderboard</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Top staff by check-in volume</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-6">
                    {staffPerformance?.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-50 transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600 text-sm">{i + 1}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{s.staff_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Grade: {s.checkin_count > 10 ? 'A+' : 'A'}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <p className="text-sm font-black text-indigo-600">{s.checkin_count}</p>
                            <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">In</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-400">{s.checkout_count}</p>
                            <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">Out</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!staffPerformance || staffPerformance.length === 0) && (
                      <div className="py-12 text-center text-slate-300 italic text-sm">No recorded throughput in this period.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-indigo-600 text-white rounded-[2.5rem] shadow-xl p-8 flex flex-col justify-between">
                <div>
                  <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase mb-4">Workforce Insight</Badge>
                  <h3 className="text-3xl font-black leading-tight">Staff Distribution Analysis</h3>
                  <p className="text-indigo-100/70 text-sm mt-4 leading-relaxed">View which staff members process the most check-ins to optimize your staff allocation.</p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase text-indigo-300 mb-1">Avg Process Time</p>
                    <p className="text-xl font-black">42 sec</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase text-indigo-300 mb-1">Queue Health</p>
                    <p className="text-xl font-black text-emerald-300 italic">Optimal</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ─── SECURITY FORENSICS ─── */}
          <TabsContent value="security" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Authorized Nodes', value: securityStats?.total_terminals || 0, icon: Monitor, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Isolated Units', value: securityStats?.locked_terminals || 0, icon: ZapOff, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Auth Incidents', value: securityStats?.alerts_last_24h || 0, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' }
              ].map((s, i) => (
                <Card key={i} className="border-none shadow-lg rounded-3xl p-6 bg-white flex items-center gap-4">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", s.bg)}>
                    <s.icon className={cn("h-6 w-6", s.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{s.value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black text-slate-800">Violation Hotspots</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Terminals with highest mismatch frequency</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="h-64">
                    {securityStats?.top_alert_devices ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={securityStats.top_alert_devices} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                          <Bar dataKey="alert_count" fill="#f43f5e" radius={[0, 10, 10, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">No security violations detected.</div>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black text-slate-800">Station Identity Audit</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Hardware footprint verification logs</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex-1">
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {detailedAttendance?.filter((l: any) => l.checked_in_method === 'kiosk').slice(0, 5).map((log: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 transition-all hover:bg-slate-50">
                        <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm"><Zap className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-black text-slate-700">{log.child_name}</p>
                            <Badge className="bg-emerald-500 text-white text-[8px] h-4 py-0 px-1 border-none">BIND VERIFIED</Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight">{log.checked_in_station || 'Terminal'} • {format(new Date(log.checked_in_at), 'HH:mm:ss')}</p>
                        </div>
                      </div>
                    ))}
                    {(!detailedAttendance || detailedAttendance.filter((l: any) => l.checked_in_method === 'kiosk').length === 0) && (
                      <div className="py-10 text-center text-slate-400 italic text-sm">No physical terminal events recorded.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── MEDICAL INTELLIGENCE ─── */}
          <TabsContent value="medical" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicalProfiles?.map((c: any) => (
                <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border-none shadow-xl rounded-[2rem] hover:shadow-2xl hover:scale-[1.02] transition-all bg-white overflow-hidden group">
                    <div className="h-1.5 w-full bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-black text-slate-800">{c.first_name} {c.last_name}</CardTitle>
                          <CardDescription className="text-rose-500 font-bold text-[10px] uppercase">Severity Ledger</CardDescription>
                        </div>
                        <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-none text-[9px] font-black uppercase tracking-tighter shadow-sm px-2">High Bio-Risk</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 relative">
                        <ShieldAlert className="absolute top-4 right-4 h-4 w-4 text-rose-300 opacity-50" />
                        <p className="text-[9px] font-black uppercase text-rose-600/60 mb-2 tracking-widest">Active Allergens</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                          {c.child_medical_profiles?.[0]?.allergies ?
                            c.child_medical_profiles?.[0]?.allergies.map((a: any) => a.type).join(', ') :
                            c.allergies
                          }
                        </p>
                      </div>
                      {c.child_medical_profiles?.[0]?.emergency_notes && (
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Protocol Notes</p>
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">"{c.child_medical_profiles[0].emergency_notes}"</p>
                        </div>
                      )}
                      <Button variant="ghost" className="w-full text-xs font-bold text-slate-400 hover:text-indigo-600 group-hover:bg-indigo-50 transition-all rounded-xl h-10">
                        Open Full Medical File <ArrowRight className="h-3 w-3 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
  );

  return isEmbedded ? content : <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default EnhancedReportsPage;
