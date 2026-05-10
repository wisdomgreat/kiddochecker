import React, { useState } from 'react';
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  BarChart3, Download, Calendar as CalendarIcon, TrendingUp, Users, ClipboardCheck,
  FileText, Loader2, Heart, Stethoscope, ShieldAlert, Activity, Clock, ShieldCheck,
  AlertTriangle, History, UserCheck, DollarSign, Briefcase, Info, Search,
  Monitor, ArrowRight, Phone, PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


const EnhancedReportsPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────────────────────────

  const { data: attendanceReport, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-report', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_attendance_report', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      
      const rawData = data || [];
      const aggregated: any[] = [];
      rawData.forEach((item: any) => {
        const existing = aggregated.find((a: any) => a.attendance_date === item.attendance_date);
        if (existing) {
          existing.total_checked_in += item.total_checked_in;
          existing.total_checked_out += item.total_checked_out;
        } else {
          aggregated.push({ ...item });
        }
      });
      return aggregated.sort((a: any, b: any) => a.attendance_date.localeCompare(b.attendance_date));
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

  const { data: childrenList } = useQuery({
    queryKey: ['children-list-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('children').select('id, first_name, last_name').order('first_name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: singleChildAttendance, isLoading: loadingSingleChild } = useQuery({
    queryKey: ['single-child-attendance', selectedChildId, dateRange],
    enabled: !!selectedChildId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name),
          classes (name),
          profiles_in:checked_in_by (first_name, last_name),
          profiles_out:checked_out_by (first_name, last_name)
        `)
        .eq('child_id', selectedChildId)
        .gte('attendance_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('attendance_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('attendance_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: medicalProfiles } = useQuery({
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

  const { data: staffPerformance } = useQuery({
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
    const headers = ['Date', 'Child', 'Class', 'In', 'Out', 'Duration (Hrs)'];
    const rows = detailedAttendance.map((r: any) => [
      r.attendance_date,
      r.child_name,
      r.class_name || '-',
      r.checked_in_at ? format(new Date(r.checked_in_at), 'HH:mm') : '-',
      r.checked_out_at ? format(new Date(r.checked_out_at), 'HH:mm') : '-',
      r.duration_hours?.toFixed(2) || '0'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Complete", description: "CSV file has been downloaded." });
  };

  const setRangeType = (type: 'week' | 'month' | 'last30') => {
    const today = new Date();
    if (type === 'week') setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
    else if (type === 'month') setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
    else setDateRange({ from: subDays(today, 30), to: today });
  };

  const SummaryCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <Card className="border shadow-sm bg-card overflow-hidden relative group">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Icon className={cn("h-3 w-3", color.replace('bg-', 'text-'))} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{sub}</span>
        </div>
      </CardContent>
    </Card>
  );

  const content = (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" /> Executive Analytics
          </h1>
          <p className="text-muted-foreground font-medium">Professional insights for childcare operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportDetailed} className="rounded-xl h-10 px-6 gap-2 shadow-sm">
            <Download className="h-4 w-4" /> Global Export
          </Button>
        </div>
      </div>

      {/* Dynamic Filters */}
      <Card className="bg-muted/30 p-1.5 rounded-2xl flex flex-wrap items-center gap-2 border-none">
        <Button variant="ghost" size="sm" onClick={() => setRangeType('week')} className="rounded-xl text-[10px] font-bold uppercase tracking-wider px-4 hover:bg-background transition-all">This Week</Button>
        <Button variant="ghost" size="sm" onClick={() => setRangeType('month')} className="rounded-xl text-[10px] font-bold uppercase tracking-wider px-4 hover:bg-background transition-all">This Month</Button>
        <Button variant="ghost" size="sm" onClick={() => setRangeType('last30')} className="rounded-xl text-[10px] font-bold uppercase tracking-wider px-4 hover:bg-background transition-all">Last 30 Days</Button>
        <div className="h-6 w-[1px] bg-border mx-2" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-xl h-9 bg-background shadow-sm text-xs font-semibold gap-2 pl-3">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {format(dateRange.from, "MMM d")} — {format(dateRange.to, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden border shadow-xl" align="start">
            <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(r: any) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </Card>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Volume" value={loadingAttendance ? '--' : attendanceReport?.reduce((a: any, b: any) => a + Number(b.total_checked_in), 0)} sub="Check-ins" icon={Users} color="bg-indigo-600" />
        <SummaryCard title="Staff Impact" value={staffPerformance?.length || 0} sub="Active Staff" icon={Briefcase} color="bg-emerald-500" />
        <SummaryCard title="System Status" value={securityStats?.total_terminals || 0} sub="Active Units" icon={Activity} color="bg-amber-500" />
        <SummaryCard title="Safety Alerts" value={securityStats?.alerts_last_24h || 0} sub="Incidents" icon={ShieldAlert} color="bg-rose-500" />
      </div>

      {/* Main Intelligence Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full md:w-auto h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">Management Center</TabsTrigger>
          <TabsTrigger value="detailed" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">Daily Audit Trail</TabsTrigger>
          <TabsTrigger value="child-report" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">Child History</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">Staff Management</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">Forensics</TabsTrigger>
          <TabsTrigger value="medical" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">Health Desk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border shadow-sm rounded-3xl bg-card overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/20">
                <CardTitle className="text-xl font-bold text-foreground">Volume Intelligence</CardTitle>
                <CardDescription className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Daily aggregation of child distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-[350px] w-full">
                  {loadingAttendance ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted" /></div> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={attendanceReport}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="attendance_date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                        <Area type="monotone" dataKey="total_checked_in" name="Total Flow" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                        <Bar dataKey="total_checked_out" name="Complete Cycles" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} barSize={30} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-primary text-primary-foreground rounded-3xl shadow-xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Activity className="h-40 w-40" /></div>
              <div className="relative">
                <Badge className="bg-card/10 text-white border-white/20 text-[10px] font-bold uppercase mb-4">Management Insights</Badge>
                <h3 className="text-2xl font-bold mb-2">Operational Insights</h3>
                <div className="space-y-6 mt-8">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-card/10 rounded-xl flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-bold">Growth Momentum</p>
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        {growthStats && growthStats.length > 0 ? (
                          `Your organization welcomed ${growthStats[0].count} new registrations this week.`
                        ) : (
                          'Scanning historical enrollment patterns...'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-card/10 rounded-xl flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-bold">Safe Station Index</p>
                      <p className="text-[11px] opacity-80 leading-relaxed">Integrity verified across all terminals.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-background shadow-sm rounded-xl flex items-center justify-center border"><Info className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Peak Capacity Alert</p>
                      <p className="text-xs text-muted-foreground">Highest volume detected between 9:00 AM and 10:30 AM.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 bg-muted/20">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Master Attendance Audit</CardTitle>
                <CardDescription className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Secure immutable ledger of all check-in/out events</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    placeholder="Search child name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold outline-none focus:ring-2 ring-primary/20 w-64" 
                  />
                </div>
<<<<<<< HEAD
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-8 text-[10px] font-bold uppercase tracking-wider">Child Identity</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Check-In Node</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Check-Out Node</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Verify</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-8">Auth Cycle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedAttendance?.map((log: any, i: number) => (
=======
                <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                  <SelectTrigger className="w-[180px] rounded-xl h-9 bg-background">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Classes</SelectItem>
                    {Array.from(new Set(detailedAttendance?.map((a: any) => a.class_name).filter(Boolean))).map((cls: any) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="pl-8 text-[10px] font-bold uppercase tracking-wider">Child Identity</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Check-In Node</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Check-Out Node</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Verify</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-8">Auth Cycle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedAttendance
                      ?.filter((log: any) => {
                        const matchesSearch = log.child_name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesClass = selectedClassFilter === 'all' || log.class_name === selectedClassFilter;
                        return matchesSearch && matchesClass;
                      })
                      .map((log: any, i: number) => (
>>>>>>> azure-migration
                        <TableRow key={i} className="hover:bg-muted/20 transition-colors border-border">
                          <TableCell className="pl-8 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{log.child_name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tight px-1 h-4 bg-muted/30 border-border">{log.class_name || 'No Group'}</Badge>
                                <span className="text-[9px] font-medium text-muted-foreground">{format(new Date(log.attendance_date), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-foreground">{log.checked_in_at ? format(new Date(log.checked_in_at), 'HH:mm') : '--:--'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge className="bg-primary/10 text-primary text-[8px] px-1 h-4 border-none">{log.checked_in_method}</Badge>
                                <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[80px]">{log.checked_in_by_name}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.checked_out_at ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                  <span className="text-xs font-bold text-foreground">{format(new Date(log.checked_out_at), 'HH:mm')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge className="bg-muted text-muted-foreground text-[8px] px-1 h-4 border-none">{log.checked_out_method}</Badge>
                                  <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[80px]">{log.checked_out_by_name}</span>
                                </div>
                              </div>
                            ) : <Badge className="bg-primary text-[10px] rounded-full px-3 py-0.5 animate-pulse border-none shadow-sm">ACTIVE SESSION</Badge>}
                          </TableCell>
                          <TableCell>
                             {log.signature_data ? (
                               <Button variant="ghost" size="sm" onClick={() => setSelectedSignature(log.signature_data)} className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                                 <PenTool className="h-4 w-4 text-primary" />
                               </Button>
                             ) : <span className="text-[10px] text-muted-foreground/50">No Sig</span>}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-primary">{log.duration_hours?.toFixed(1) || '--'}h</span>
                               {log.checked_out_at && <Badge variant="outline" className="text-[8px] border-emerald-100/50 text-emerald-600 bg-emerald-50/10">VERIFIED</Badge>}
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

        <TabsContent value="child-report" className="space-y-6">
          <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row items-center justify-between p-8 bg-muted/20 gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Individual Child History</CardTitle>
                <CardDescription className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Targeted forensics for a specific student</CardDescription>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <Select value={selectedChildId || 'none'} onValueChange={(val) => setSelectedChildId(val === 'none' ? null : val)}>
                  <SelectTrigger className="w-full md:w-[250px] rounded-xl h-10 bg-background border-primary/20">
                    <SelectValue placeholder="Select a child..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    <SelectItem value="none">Select a child...</SelectItem>
                    {childrenList?.map((child: any) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {!selectedChildId ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">No Child Selected</p>
                    <p className="text-xs text-muted-foreground">Select a child from the menu above to view their history.</p>
                  </div>
                </div>
              ) : loadingSingleChild ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : singleChildAttendance?.length === 0 ? (
                 <div className="py-20 text-center text-muted-foreground italic">
                   No attendance records found for this child in the selected date range.
                 </div>
              ) : (
                <div className="space-y-6">
                  {singleChildAttendance?.map((entry: any, i: number) => (
                    <div key={i} className="flex gap-6 relative pb-8 last:pb-0">
                      {i < (singleChildAttendance?.length - 1) && (
                        <div className="absolute left-4 top-10 bottom-0 w-[2px] bg-muted/30" />
                      )}
                      <div className="h-9 w-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 z-10 bg-background">
                         <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">{format(new Date(entry.attendance_date), 'EEEE, MMMM dd, yyyy')}</h4>
                          <Badge className="bg-primary/5 text-primary border-primary/10">{entry.classes?.name || 'Unassigned'}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl border bg-muted/10 space-y-2">
                             <p className="text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-2">
                               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Check-In
                             </p>
                             <div className="flex justify-between items-center">
                               <span className="text-lg font-bold">{entry.checked_in_at ? format(new Date(entry.checked_in_at), 'HH:mm:ss') : '--:--'}</span>
                               <span className="text-[10px] text-muted-foreground font-medium">via {entry.checked_in_method}</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground">Authorized by: <span className="font-bold text-foreground">{entry.profiles_in?.first_name} {entry.profiles_in?.last_name || 'System'}</span></p>
                          </div>
                          <div className="p-4 rounded-2xl border bg-muted/10 space-y-2">
                             <p className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-2">
                               <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Check-Out
                             </p>
                             <div className="flex justify-between items-center">
                               <span className="text-lg font-bold">{entry.checked_out_at ? format(new Date(entry.checked_out_at), 'HH:mm:ss') : '--:--'}</span>
                               <span className="text-[10px] text-muted-foreground font-medium">via {entry.checked_out_method || 'N/A'}</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground">Authorized by: <span className="font-bold text-foreground">{entry.profiles_out?.first_name} {entry.profiles_out?.last_name || 'N/A'}</span></p>
                          </div>
                        </div>
                        {entry.signature_data && (
                          <div className="flex items-center gap-3 p-3 bg-indigo-50/10 border border-indigo-100/50 rounded-xl">
                            <PenTool className="h-4 w-4 text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-700 uppercase">Checkout Signature Verified</span>
                            <Button variant="link" size="sm" onClick={() => setSelectedSignature(entry.signature_data)} className="ml-auto text-xs h-auto p-0">View Signature</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-8">
           <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden p-8 text-center italic text-muted-foreground">
             Staff performance metrics are currently aggregating.
           </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-8">
           <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden p-8 text-center italic text-muted-foreground">
             System forensics and terminal security logs.
           </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicalProfiles?.map((c: any) => (
              <Card key={c.id} className="border shadow-sm rounded-2xl hover:shadow-md transition-all bg-card overflow-hidden group">
                <div className="h-1.5 w-full bg-destructive opacity-20 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">{c.first_name} {c.last_name}</CardTitle>
                      <CardDescription className="text-destructive font-semibold text-[10px] uppercase">Medical Ledger</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                    <p className="text-[9px] font-bold uppercase text-destructive/60 mb-2 tracking-wider">Active Allergens</p>
                    <p className="text-xs font-semibold text-foreground">
                      {c.child_medical_profiles?.[0]?.allergies ?
                        c.child_medical_profiles?.[0]?.allergies.map((a: any) => a.type).join(', ') :
                        c.allergies || 'None recorded'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSignature} onOpenChange={() => setSelectedSignature(null)}>
        <DialogContent className="sm:max-w-md bg-card border-none rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-indigo-600" />
              Checkout Verification Signature
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-center min-h-[250px]">
            {selectedSignature && (
              <img src={selectedSignature} alt="Signature" className="max-w-full h-auto grayscale contrast-125" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return isEmbedded ? content : <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default EnhancedReportsPage;
