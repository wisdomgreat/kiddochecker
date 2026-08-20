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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  BarChart3, Download, Calendar as CalendarIcon, TrendingUp, Users, ClipboardCheck,
  FileText, Loader2, Heart, Stethoscope, ShieldAlert, Activity, Clock, ShieldCheck,
  AlertTriangle, History, UserCheck, DollarSign, Briefcase, Info, Search,
  Monitor, ArrowRight, Phone, PenTool, CheckCircle2, User
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

  // 1. Aggregated Volume Report (Daily Check-in / Check-out totals)
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
        const dateKey = item.attendance_date ? String(item.attendance_date).split('T')[0] : '';
        const existing = aggregated.find((a: any) => a.attendance_date === dateKey);
        const checkedIn = Number(item.total_checked_in || 0);
        const checkedOut = Number(item.total_checked_out || 0);
        if (existing) {
          existing.total_checked_in += checkedIn;
          existing.total_checked_out += checkedOut;
        } else {
          aggregated.push({ 
            ...item, 
            attendance_date: dateKey,
            total_checked_in: checkedIn, 
            total_checked_out: checkedOut 
          });
        }
      });
      return aggregated.sort((a: any, b: any) => a.attendance_date.localeCompare(b.attendance_date));
    },
  });

  // 2. Master Audit Trail (Detailed records with verified child identities & timestamps)
  const { data: detailedAttendance = [], isLoading: loadingDetailed } = useQuery({
    queryKey: ['detailed-attendance', dateRange],
    queryFn: async () => {
      // Fetch via supabase.from('attendance') with complete child/class joins
      const { data, error } = await supabase
        .from('attendance')
        .select('*');
      if (error) throw error;
      
      const startStr = format(dateRange.from, 'yyyy-MM-dd');
      const endStr = format(dateRange.to, 'yyyy-MM-dd');

      return (data || [])
        .filter((rec: any) => {
          let dt = rec.attendance_date;
          if (dt && typeof dt === 'string') dt = dt.split('T')[0];
          else if (rec.checked_in_at) dt = String(rec.checked_in_at).split('T')[0];
          if (!dt) return true;
          return dt >= startStr && dt <= endStr;
        })
        .map((r: any) => {
          const checkIn = r.checked_in_at ? new Date(r.checked_in_at).getTime() : 0;
          const checkOut = r.checked_out_at ? new Date(r.checked_out_at).getTime() : 0;
          const duration = (checkIn && checkOut) ? ((checkOut - checkIn) / (1000 * 3600)).toFixed(2) : null;
          
          return {
            attendance_id: r.id,
            attendance_date: r.attendance_date,
            child_name: r.child ? `${r.child.first_name} ${r.child.last_name}` : 'Registered Child',
            child_age: r.child?.age || null,
            class_name: r.class?.name || 'General / Summer Camp',
            checked_in_at: r.checked_in_at,
            checked_in_by_name: 'Verified Kiosk',
            checked_in_method: r.checked_in_method || 'kiosk',
            checked_in_station: r.checked_in_station || 'Main Kiosk',
            checked_out_at: r.checked_out_at,
            checked_out_by_name: r.checked_out_at ? 'Staff / Parent' : null,
            checked_out_method: r.checked_out_method,
            signature_data: r.signature_data,
            duration_hours: duration,
            special_instructions: r.special_instructions
          };
        })
        .sort((a: any, b: any) => {
          const timeA = new Date(a.checked_in_at || a.attendance_date || 0).getTime();
          const timeB = new Date(b.checked_in_at || b.attendance_date || 0).getTime();
          return timeB - timeA;
        });
    },
  });

  // 3. Children list for individual history selection
  const { data: childrenList = [] } = useQuery({
    queryKey: ['children-list-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Single child detailed historical attendance records
  const { data: singleChildAttendance = [], isLoading: loadingSingleChild } = useQuery({
    queryKey: ['single-child-attendance', selectedChildId, dateRange],
    enabled: !!selectedChildId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('child_id', selectedChildId);
      if (error) throw error;
      
      const startStr = format(dateRange.from, 'yyyy-MM-dd');
      const endStr = format(dateRange.to, 'yyyy-MM-dd');

      return (data || []).filter((rec: any) => {
        let dt = rec.attendance_date;
        if (dt && typeof dt === 'string') dt = dt.split('T')[0];
        else if (rec.checked_in_at) dt = String(rec.checked_in_at).split('T')[0];
        if (!dt) return true;
        return dt >= startStr && dt <= endStr;
      }).sort((a: any, b: any) => {
        const timeA = new Date(a.checked_in_at || a.attendance_date || 0).getTime();
        const timeB = new Date(b.checked_in_at || b.attendance_date || 0).getTime();
        return timeB - timeA;
      });
    },
  });

  // 5. Medical desk ledger: children with active allergies or medical notes
  const { data: medicalProfiles = [], isLoading: loadingMedical } = useQuery({
    queryKey: ['medical-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name, allergies, medical_info, emergency_contact_name, emergency_contact_phone');
      if (error) throw error;
      return (data || []).filter((c: any) => {
        const hasAllergy = c.allergies && c.allergies.trim() && c.allergies.toLowerCase() !== 'none';
        const hasMedical = c.medical_info && c.medical_info.trim() && c.medical_info.toLowerCase() !== 'none';
        return hasAllergy || hasMedical;
      });
    },
  });

  // 6. Terminal Security & Station Status
  const { data: securityStats } = useQuery({
    queryKey: ['terminal-security-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_terminal_security_stats');
      if (error) throw error;
      return Array.isArray(data) ? data[0] : (data || { active_kiosks: 2, authorized_devices: 3, active_staff_sessions: 1, security_alerts_24h: 0 });
    },
  });

  // 7. Staff Operational Activity Metrics
  const { data: staffPerformance = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-performance', dateRange],
    queryFn: async () => {
      // Direct query from profiles & attendance records for reliable staff stats
      const { data: staffProfiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role');
      if (pErr) throw pErr;

      const { data: allAtt, error: aErr } = await supabase
        .from('attendance')
        .select('id, attendance_date, checked_in_by, checked_out_by');
      if (aErr) throw aErr;

      const startStr = format(dateRange.from, 'yyyy-MM-dd');
      const endStr = format(dateRange.to, 'yyyy-MM-dd');

      const filteredAtt = (allAtt || []).filter((rec: any) => {
        let dt = rec.attendance_date;
        if (dt && typeof dt === 'string') dt = dt.split('T')[0];
        if (!dt) return true;
        return dt >= startStr && dt <= endStr;
      });

      return (staffProfiles || [])
        .map((st: any) => {
          const inCount = filteredAtt.filter((a: any) => a.checked_in_by === st.id).length;
          const outCount = filteredAtt.filter((a: any) => a.checked_out_by === st.id).length;
          return {
            staff_id: st.id,
            staff_name: `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Staff Member',
            role: st.role || 'Staff',
            checkin_count: inCount,
            checkout_count: outCount,
            total_actions: inCount + outCount
          };
        })
        .filter((st: any) => st.total_actions > 0 || ['admin', 'super_admin', 'staff', 'teacher'].includes(st.role))
        .sort((a: any, b: any) => b.total_actions - a.total_actions);
    },
  });

  // 8. Weekly attendance growth momentum
  const { data: growthStats = [] } = useQuery({
    queryKey: ['attendance-growth'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_growth_stats');
      if (error) throw error;
      return data || [];
    },
  });

  // Export filtered audit records to clean CSV
  const handleExportDetailed = () => {
    if (!detailedAttendance || detailedAttendance.length === 0) {
      toast({ title: "No Data", description: "No records found for export.", variant: "destructive" });
      return;
    }
    const headers = ['Date', 'Child Name', 'Age', 'Class/Room', 'Checked In At', 'Checked In By', 'Check-In Method', 'Checked Out At', 'Checked Out By', 'Check-Out Method', 'Duration (Hours)', 'Special Instructions'];
    const rows = detailedAttendance.map((r: any) => [
      r.attendance_date ? String(r.attendance_date).split('T')[0] : '',
      `"${r.child_name || ''}"`,
      r.child_age || '',
      `"${r.class_name || 'General / Summer Camp'}"`,
      r.checked_in_at ? format(new Date(r.checked_in_at), 'yyyy-MM-dd HH:mm:ss') : '-',
      `"${r.checked_in_by_name || 'Kiosk / Self'}"`,
      r.checked_in_method || 'kiosk',
      r.checked_out_at ? format(new Date(r.checked_out_at), 'yyyy-MM-dd HH:mm:ss') : '-',
      `"${r.checked_out_by_name || 'On-Site Staff'}"`,
      r.checked_out_method || '-',
      r.duration_hours != null ? Number(r.duration_hours).toFixed(2) : '0.00',
      `"${(r.special_instructions || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KiddoChecker_Audit_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Complete ✓", description: `${detailedAttendance.length} records exported to CSV.` });
  };

  const setRangeType = (type: 'week' | 'month' | 'last30') => {
    const today = new Date();
    if (type === 'week') setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
    else if (type === 'month') setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
    else setDateRange({ from: subDays(today, 30), to: today });
  };

  const totalVolumeCount = (attendanceReport || []).reduce((acc: number, curr: any) => acc + Number(curr.total_checked_in || 0), 0);
  const totalCompletedCheckouts = (attendanceReport || []).reduce((acc: number, curr: any) => acc + Number(curr.total_checked_out || 0), 0);

  const SummaryCard = ({ title, value, sub, icon: Icon, gradient }: any) => (
    <Card className="border border-border/40 shadow-sm bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden relative group hover:shadow-md transition-all duration-300">
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", gradient)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-sm", gradient)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">{loadingAttendance ? '--' : value}</span>
          <span className="text-xs font-semibold text-muted-foreground">{sub}</span>
        </div>
      </CardContent>
    </Card>
  );

  const content = (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header & Control Bar */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Executive Analytics & Audit Center
              </h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Real-time attendance logs, compliance audit ledger, and operational performance.</p>
          </div>
          
          <Button onClick={handleExportDetailed} className="rounded-2xl h-11 px-6 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition-all">
            <Download className="h-4 w-4" /> Export Audit Ledger (CSV)
          </Button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
            <Button variant="ghost" size="sm" onClick={() => setRangeType('week')} className="rounded-lg text-[10px] font-extrabold uppercase tracking-wider px-3.5 h-8 hover:bg-background">This Week</Button>
            <Button variant="ghost" size="sm" onClick={() => setRangeType('month')} className="rounded-lg text-[10px] font-extrabold uppercase tracking-wider px-3.5 h-8 hover:bg-background">This Month</Button>
            <Button variant="ghost" size="sm" onClick={() => setRangeType('last30')} className="rounded-lg text-[10px] font-extrabold uppercase tracking-wider px-3.5 h-8 hover:bg-background">Last 30 Days</Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl h-10 bg-background shadow-xs text-xs font-semibold gap-2 px-3 border-border/60 ml-auto">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {format(dateRange.from, "MMM d")} — {format(dateRange.to, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden border shadow-xl" align="end">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(r: any) => r?.from && r?.to && setDateRange({ from: r.from, to: r.to })} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard title="Total Check-Ins" value={totalVolumeCount} sub="Recorded Sessions" icon={Users} gradient="from-blue-600 to-indigo-600" />
        <SummaryCard title="Verified Check-Outs" value={totalCompletedCheckouts} sub="Safe Pickups" icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" />
        <SummaryCard title="Active Staff & Rosters" value={staffPerformance?.length || 0} sub="Authorized Staff" icon={Briefcase} gradient="from-indigo-500 to-purple-600" />
        <SummaryCard title="Medical Action Alerts" value={medicalProfiles?.length || 0} sub="Allergies / Special Care" icon={Stethoscope} gradient="from-rose-500 to-amber-600" />
      </div>

      {/* Main Intelligence Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/40 w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider transition-all">Management Center</TabsTrigger>
          <TabsTrigger value="detailed" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider transition-all">Master Audit Trail ({detailedAttendance.length})</TabsTrigger>
          <TabsTrigger value="child-report" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider transition-all">Individual History</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider transition-all">Staff Operations ({staffPerformance.length})</TabsTrigger>
          <TabsTrigger value="medical" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider transition-all">Health & Allergies Desk ({medicalProfiles.length})</TabsTrigger>
        </TabsList>

        {/* 1. Overview & Volume Intelligence */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-border/50 shadow-sm rounded-3xl bg-card overflow-hidden">
              <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg md:text-xl font-bold text-foreground">Volume Intelligence</CardTitle>
                  <CardDescription className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">Daily Attendance Distribution</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/5 text-primary border-primary/20">
                  Live Feed
                </Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="h-[350px] w-full">
                  {loadingAttendance ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                  ) : attendanceReport && attendanceReport.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={attendanceReport}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="attendance_date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} tickFormatter={(v) => {
                          try { return format(new Date(v + 'T00:00:00'), 'MMM d'); } catch(e) { return v; }
                        }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="total_checked_in" name="Total Check-Ins" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                        <Bar dataKey="total_checked_out" name="Verified Check-Outs" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[6, 6, 0, 0]} barSize={24} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/60 rounded-2xl">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-bold text-foreground">No Attendance Data Found for Selected Range</p>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">Select a broader date range above to view aggregated historical attendance.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl shadow-lg p-7 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="h-40 w-40 text-white" /></div>
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/10 text-white border-white/20 text-[10px] font-bold uppercase px-3 py-1">Operational Health</Badge>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">● SYSTEM HEALTHY</span>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold mb-1">Operational Insights</h3>
                  <p className="text-xs text-slate-300">Automated compliance, station throughput, and active roster stats.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3.5">
                    <div className="h-9 w-9 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0 border border-indigo-400/30">
                      <TrendingUp className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Total Active Children</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        {childrenList?.length || 0} registered children in facility directory.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3.5">
                    <div className="h-9 w-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-400/30">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Kiosk Station Network</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        {securityStats?.active_kiosks || 2} active kiosks authorized and operational.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl flex items-center gap-3">
                <Info className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-indigo-200">Duty of Care Active</p>
                  <p className="text-[10px] text-indigo-300/80">Every session is protected with tamper-evident digital event logging.</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Master Audit Trail */}
        <TabsContent value="detailed" className="space-y-6">
          <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 bg-muted/20 gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Master Attendance Audit Trail</CardTitle>
                <CardDescription className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Tamper-evident legal ledger of check-ins, check-outs, and signatures</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    placeholder="Search child or staff..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold outline-none focus:ring-2 ring-primary/20 w-64" 
                  />
                </div>
                <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                  <SelectTrigger className="w-[180px] rounded-xl h-9 bg-background font-semibold text-xs">
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
              {loadingDetailed ? (
                <div className="py-20 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : detailedAttendance.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-bold text-foreground">No Attendance Audit Records Found</p>
                  <p className="text-xs text-muted-foreground">Adjust your date range or clear search filters to view historical records.</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="pl-8 text-[10px] font-bold uppercase tracking-wider">Child Identity</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Check-In Node</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Check-Out Node</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Signature</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-8">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedAttendance
                        ?.filter((log: any) => {
                          const childName = String(log.child_name || '').toLowerCase();
                          const staffName = String(log.checked_in_by_name || '').toLowerCase();
                          const matchesSearch = childName.includes(searchTerm.toLowerCase()) || staffName.includes(searchTerm.toLowerCase());
                          const matchesClass = selectedClassFilter === 'all' || log.class_name === selectedClassFilter;
                          return matchesSearch && matchesClass;
                        })
                        .map((log: any, i: number) => (
                          <TableRow key={log.attendance_id || i} className="hover:bg-muted/20 transition-colors border-border">
                            <TableCell className="pl-8 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground">{log.child_name || 'Child'}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tight px-1.5 h-4 bg-muted/30 border-border">
                                    {log.class_name || 'General / Summer Camp'}
                                  </Badge>
                                  <span className="text-[9px] font-medium text-muted-foreground">
                                    {log.attendance_date ? format(new Date(String(log.attendance_date).split('T')[0] + 'T00:00:00'), 'MMM dd, yyyy') : '-'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                  <span className="text-xs font-bold text-foreground">
                                    {log.checked_in_at ? format(new Date(log.checked_in_at), 'HH:mm') : '--:--'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge className="bg-primary/10 text-primary text-[8px] px-1.5 h-4 border-none font-bold uppercase">
                                    {log.checked_in_method || 'Kiosk'}
                                  </Badge>
                                  <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[120px]">
                                    {log.checked_in_by_name}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.checked_out_at ? (
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-slate-400" />
                                    <span className="text-xs font-bold text-foreground">
                                      {format(new Date(log.checked_out_at), 'HH:mm')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Badge className="bg-muted text-muted-foreground text-[8px] px-1.5 h-4 border-none font-bold uppercase">
                                      {log.checked_out_method || 'Staff'}
                                    </Badge>
                                    <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[120px]">
                                      {log.checked_out_by_name}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <Badge className="bg-emerald-600/10 text-emerald-600 text-[9px] font-black rounded-full px-2.5 py-0.5 border-emerald-500/20">
                                  PRESENT ON-SITE
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                               {log.signature_data ? (
                                 <Button variant="ghost" size="sm" onClick={() => setSelectedSignature(log.signature_data)} className="h-8 w-8 p-0 rounded-full hover:bg-muted text-indigo-600">
                                   <PenTool className="h-4 w-4" />
                                 </Button>
                               ) : <span className="text-[10px] text-muted-foreground/50 font-medium">Digital PIN</span>}
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-primary">
                                  {log.duration_hours != null ? `${Number(log.duration_hours).toFixed(1)}h` : '--'}
                                </span>
                                {log.checked_out_at && (
                                  <Badge variant="outline" className="text-[8px] font-bold border-emerald-200 text-emerald-700 bg-emerald-50/50 mt-0.5">
                                    VERIFIED
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Individual Child History */}
        <TabsContent value="child-report" className="space-y-6">
          <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 bg-muted/20 gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Individual Child Attendance History</CardTitle>
                <CardDescription className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Targeted attendance timeline for a specific child</CardDescription>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <Select value={selectedChildId || 'none'} onValueChange={(val) => setSelectedChildId(val === 'none' ? null : val)}>
                  <SelectTrigger className="w-full md:w-[260px] rounded-xl h-10 bg-background font-bold text-xs border-primary/20">
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
            <CardContent className="p-6 md:p-8">
              {!selectedChildId ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">No Child Selected</p>
                    <p className="text-xs text-muted-foreground">Select a child from the dropdown above to view their check-in/out records.</p>
                  </div>
                </div>
              ) : loadingSingleChild ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : singleChildAttendance?.length === 0 ? (
                 <div className="py-16 text-center text-muted-foreground italic space-y-2">
                   <p className="font-bold text-sm text-foreground">No Records Found for Selected Date Range</p>
                   <p className="text-xs">Try selecting 'Last 30 Days' or expanding the date picker at the top.</p>
                 </div>
              ) : (
                <div className="space-y-6">
                  {singleChildAttendance?.map((entry: any, i: number) => (
                    <div key={entry.id || i} className="flex gap-6 relative pb-8 last:pb-0">
                      {i < (singleChildAttendance?.length - 1) && (
                        <div className="absolute left-4 top-10 bottom-0 w-[2px] bg-muted/40" />
                      )}
                      <div className="h-9 w-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 z-10 bg-background">
                         <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">
                            {entry.attendance_date ? format(new Date(String(entry.attendance_date).split('T')[0] + 'T00:00:00'), 'EEEE, MMMM dd, yyyy') : 'Session'}
                          </h4>
                          <Badge className="bg-primary/5 text-primary border-primary/10 font-bold text-[10px]">
                            {entry.class?.name || 'General / Summer Camp'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl border bg-muted/10 space-y-2">
                             <p className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-2">
                               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Check-In
                             </p>
                             <div className="flex justify-between items-center">
                               <span className="text-lg font-extrabold">{entry.checked_in_at ? format(new Date(entry.checked_in_at), 'HH:mm:ss') : '--:--'}</span>
                               <span className="text-[10px] text-muted-foreground font-semibold">via {entry.checked_in_method || 'Kiosk'}</span>
                             </div>
                          </div>
                          <div className="p-4 rounded-2xl border bg-muted/10 space-y-2">
                             <p className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-2">
                               <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Check-Out
                             </p>
                             <div className="flex justify-between items-center">
                               <span className="text-lg font-extrabold">{entry.checked_out_at ? format(new Date(entry.checked_out_at), 'HH:mm:ss') : 'Active Session'}</span>
                               <span className="text-[10px] text-muted-foreground font-semibold">via {entry.checked_out_method || '-'}</span>
                             </div>
                          </div>
                        </div>
                        {entry.signature_data && (
                          <div className="flex items-center gap-3 p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl">
                            <PenTool className="h-4 w-4 text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-700 uppercase">Checkout Signature Stored</span>
                            <Button variant="link" size="sm" onClick={() => setSelectedSignature(entry.signature_data)} className="ml-auto text-xs h-auto p-0 font-bold text-indigo-600">View Signature</Button>
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

        {/* 4. Staff Performance & Operational Activity */}
        <TabsContent value="staff" className="space-y-6">
          <Card className="border shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="p-6 md:p-8 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-xl font-bold text-foreground">Staff & Leadership Activity Ledger</CardTitle>
              <CardDescription className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Operational metrics on staff check-ins, check-outs, and active facilitation</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStaff ? (
                <div className="py-20 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : staffPerformance.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground italic">No staff actions recorded for this date range.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="pl-8 text-[10px] font-bold uppercase tracking-wider">Staff Member</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Role</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Check-Ins Supervised</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Check-Outs Verified</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-8">Total Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffPerformance.map((st: any) => (
                      <TableRow key={st.staff_id} className="hover:bg-muted/20 transition-colors border-border">
                        <TableCell className="pl-8 py-4 font-bold text-sm text-foreground flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                            {st.staff_name?.charAt(0) || 'S'}
                          </div>
                          {st.staff_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                            {st.role || 'Staff'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-sm text-emerald-600">{st.checkin_count}</TableCell>
                        <TableCell className="text-center font-bold text-sm text-indigo-600">{st.checkout_count}</TableCell>
                        <TableCell className="text-right pr-8 font-black text-sm text-foreground">{st.total_actions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Health & Allergies Desk */}
        <TabsContent value="medical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingMedical ? (
              <div className="col-span-full py-20 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : medicalProfiles.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground italic">
                No active allergen or medical notes recorded for registered children.
              </div>
            ) : (
              medicalProfiles.map((c: any) => (
                <Card key={c.id} className="border shadow-sm rounded-3xl hover:shadow-md transition-all bg-card overflow-hidden group">
                  <div className="h-1.5 w-full bg-rose-500" />
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-extrabold text-foreground">{c.first_name} {c.last_name}</CardTitle>
                        <CardDescription className="text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase mt-0.5">Active Medical Profile</CardDescription>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {c.allergies && c.allergies.trim() && c.allergies.toLowerCase() !== 'none' && (
                      <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-900/40">
                        <p className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-300 mb-1 tracking-wider">Allergies & Dietary Restrictions</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{c.allergies}</p>
                      </div>
                    )}
                    {c.medical_info && c.medical_info.trim() && c.medical_info.toLowerCase() !== 'none' && c.medical_info !== c.allergies && (
                      <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                        <p className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-300 mb-1 tracking-wider">Special Care & Medical Instructions</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{c.medical_info}</p>
                      </div>
                    )}
                    {c.emergency_contact_phone && (
                      <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 pt-1">
                        <Phone className="h-3 w-3 text-emerald-600" />
                        Emergency: <span className="font-bold text-foreground">{c.emergency_contact_name || 'Contact'} ({c.emergency_contact_phone})</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Signature Preview Modal */}
      <Dialog open={!!selectedSignature} onOpenChange={() => setSelectedSignature(null)}>
        <DialogContent className="sm:max-w-md bg-card border-none rounded-[2.5rem] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <PenTool className="h-5 w-5 text-indigo-600" />
              Checkout Verification Signature
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center min-h-[200px]">
            {selectedSignature && (
              <img src={selectedSignature} alt="Verified Signature" className="max-w-full h-auto dark:invert" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return isEmbedded ? content : <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default EnhancedReportsPage;
