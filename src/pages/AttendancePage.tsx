import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CheckSquare, Clock, Download, Loader2, RefreshCw, TrendingUp, Users, Sparkles, ChevronRight, Activity, Bell, Baby } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { useAuth } from '@/context/AuthContext';
import { AttendanceService } from '@/services/attendanceService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckInDialog } from '@/components/attendance/CheckInDialog';
import { ClassAttendanceReport } from '@/components/attendance/ClassAttendanceReport';
import { cn } from '@/lib/utils';

const AttendancePage = () => {
  const { attendance, isLoading, error, refetch, checkOut, isCheckingOut } = useAttendance();
  const { isConnected } = useRealtimeAttendance();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!attendance) return { todayCheckins: 0, currentlyPresent: 0, checkedOut: 0, lateCheckouts: 0 };

    const today = new Date().toDateString();
    
    // Check-ins for TODAY specifically
    const todayCheckins = attendance.filter(r => 
      new Date(r.attendance_date).toDateString() === today && r.checked_in_at
    ).length;

    // Currently Present (Anyone with null check-out, regardless of date)
    const currentlyPresent = attendance.filter(r => r.checked_in_at && !r.checked_out_at).length;
    
    // Checked out TODAY
    const checkedOut = attendance.filter(r => 
      new Date(r.attendance_date).toDateString() === today && r.checked_out_at
    ).length;

    // Late checkouts (today)
    const lateCheckouts = attendance.filter(r => {
      if (!r.checked_out_at || new Date(r.attendance_date).toDateString() !== today) return false;
      const checkoutHour = new Date(r.checked_out_at).getHours();
      return checkoutHour >= 18;
    }).length;

    return {
      todayCheckins,
      currentlyPresent,
      checkedOut,
      lateCheckouts
    };
  }, [attendance]);

  // Get today's attendance records + anyone still checked in from previous days
  const todayAttendance = useMemo(() => {
    if (!attendance) return [];
    const today = new Date().toDateString();
    return attendance.filter(r =>
      new Date(r.attendance_date).toDateString() === today || (r.checked_in_at && !r.checked_out_at)
    ).sort((a, b) => {
      const dateA = new Date(a.checked_in_at || 0);
      const dateB = new Date(b.checked_in_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [attendance]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    return format(new Date(timestamp), 'h:mm a');
  };

  const handleCheckOut = (attendanceId: string) => {
    checkOut(attendanceId);
  };

  const handleExport = () => {
    if (!todayAttendance.length) {
      toast({
        title: "No Data",
        description: "No attendance records to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ['Child Name', 'Class', 'Check-in Time', 'Check-out Time', 'Status'];
    const rows = todayAttendance.map(record => [
      record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown',
      record.class?.name || 'No Class',
      record.checked_in_at ? formatTime(record.checked_in_at) : '-',
      record.checked_out_at ? formatTime(record.checked_out_at) : '-',
      record.checked_out_at ? 'Checked Out' : 'Present'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Attendance report has been downloaded",
    });
  };

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher', 'parent']}>
      <UnifiedDashboardLayout>
        <div className="space-y-12 max-w-[1600px] mx-auto py-12 px-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12"
          >
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Attendance
                {isConnected && (
                  <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[11px] px-3 h-6 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live Update
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-2">
                 <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Daily Logs</p>
                 <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                 <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-500">Monitoring active</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                <Button 
                    onClick={() => setShowCheckInDialog(true)}
                    className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs tracking-tight shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                >
                    <Activity className="h-4 w-4" />
                    Manual Check-in
                </Button>

              {stats.currentlyPresent > 0 && (isAdmin || isSuperAdmin) && (
                <Button 
                  variant="outline" 
                   onClick={async () => {
                    if (!window.confirm(`Are you sure you want to sign out ALL ${stats.currentlyPresent} children? This will be logged as an emergency action.`)) return;
                    
                    const actorId = user?.id;
                    let successCount = 0;
                    
                    // Filter actually present children
                    const presentRecords = todayAttendance.filter(r => !r.checked_out_at);
                    
                    for (const record of presentRecords) {
                      try {
                        const res = await AttendanceService.checkOutChild({
                          attendanceId: record.id,
                          checkedOutBy: actorId,
                          method: 'emergency_admin_bulk',
                          station: 'Staff Dashboard'
                        });
                        if (res.success) successCount++;
                      } catch {}
                    }
                    
                    toast({ title: "Bulk Sign-Out Complete", description: `Successfully signed out ${successCount} children.` });
                    refetch();
                  }}
                  className="h-14 px-8 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 rounded-2xl font-bold text-xs tracking-tight hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center gap-3"
                >
                  <Bell className="h-4 w-4" />
                  Bulk Sign-out ({stats.currentlyPresent})
                </Button>
              )}
              
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-11 w-11 rounded-xl hover:bg-white dark:hover:bg-white/5">
                   <RefreshCw className="h-4 w-4 text-slate-400" />
                </Button>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                <Button variant="ghost" size="icon" onClick={handleExport} className="h-11 w-11 rounded-xl hover:bg-white dark:hover:bg-white/5">
                   <Download className="h-4 w-4 text-slate-400" />
                </Button>
              </div>

              <Button 
                onClick={() => setIsReportDialogOpen(true)}
                className="h-14 px-8 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-tight shadow-xl shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
              >
                  <Calendar className="h-4 w-4" />
                  Full Report
              </Button>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                  { label: "Check-ins Today", val: stats.todayCheckins, icon: CheckSquare, color: "emerald", desc: "Total entries recorded" },
                  { label: "Present Now", val: stats.currentlyPresent, icon: Users, color: "indigo", desc: "Children at center" },
                  { label: "Safe Departures", val: stats.checkedOut, icon: TrendingUp, color: "slate", desc: "Check-outs completed" },
                  { label: "Late Pick-ups", val: stats.lateCheckouts, icon: Clock, color: "amber", desc: "After 6:00 PM standard" }
              ].map((s, idx) => (
                  <motion.div 
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={cn(
                        "floating-island p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden relative group",
                        s.color === 'slate' ? 'bg-slate-900 border-none' : ''
                    )}>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className={cn(
                                    "text-xs font-semibold tracking-tight mb-1",
                                    s.color === 'slate' ? 'text-slate-400' : `text-${s.color}-500`
                                )}>{s.label}</p>
                                <h3 className={cn(
                                    "text-3xl font-bold tracking-tight",
                                    s.color === 'slate' ? 'text-white' : `text-${s.color}-600`
                                )}>
                                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : s.val}
                                </h3>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-3">{s.desc}</p>
                            </div>
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm",
                                s.color === 'slate' ? 'bg-white/10' : `bg-${s.color}-50 dark:bg-white/5`
                            )}>
                                <s.icon className={cn("h-7 w-7", s.color === 'slate' ? 'text-white' : `text-${s.color}-600`)} />
                            </div>
                        </div>
                        <div className={cn(
                            "absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000",
                            `bg-${s.color}-500/10`
                        )} />
                    </Card>
                  </motion.div>
              ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-12"
          >
            {/* Class Breakdown Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">By Class</h2>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold tracking-tight focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-400"
                        />
                    </div>
                </div>
                <ClassAttendanceReport selectedDate={selectedDate} />
            </div>

            {/* Attendance Table */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Check-in Log</h2>
                    <Badge variant="outline" className="text-slate-500 border-slate-200 dark:border-white/10 font-medium text-[10px] px-3 h-6 rounded-full">
                        {todayAttendance.length} Records
                    </Badge>
                </div>

                <Card className="floating-island rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                <CardContent className="p-0">
                    {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                        <Loader2 className="h-12 w-12 animate-spin mb-4" />
                        <p className="text-xs font-bold">Loading attendance...</p>
                    </div>
                    ) : error ? (
                    <div className="py-24 text-center">
                        <p className="text-xl font-bold text-rose-500 tracking-tight">Syncing Issue</p>
                        <p className="text-xs font-semibold text-slate-400 mt-2 tracking-tight">We're having trouble reaching the server. Please try again.</p>
                        <Button variant="outline" onClick={() => refetch()} className="mt-8 rounded-2xl font-bold text-[10px]">
                        Retry Connection
                        </Button>
                    </div>
                    ) : todayAttendance.length === 0 ? (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/10 shadow-inner">
                            <CheckSquare className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-1">No activity yet</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Waiting for the first check-in today</p>
                    </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-white/5 border-none">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="px-10 h-16 font-bold text-xs text-slate-500">Child</TableHead>
                                <TableHead className="h-16 font-bold text-xs text-slate-500">Class</TableHead>
                                <TableHead className="h-16 font-bold text-xs text-slate-500">Arrival</TableHead>
                                <TableHead className="h-16 font-bold text-xs text-slate-500">Departure</TableHead>
                                <TableHead className="h-16 font-bold text-xs text-slate-500">Status</TableHead>
                                <TableHead className="px-10 h-16 text-right font-bold text-xs text-slate-500">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {todayAttendance.map((record) => (
                                <TableRow key={record.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 transition-colors group">
                                <TableCell className="px-10 py-8 align-top">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform">
                                            {(record.child as any)?.photo_url ? (
                                                <img src={(record.child as any).photo_url} className="h-full w-full object-cover" />
                                            ) : (
                                                <Baby className="h-6 w-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                            {record.child ?
                                                `${record.child.first_name} ${record.child.last_name}` :
                                                'Unknown Child'
                                            }
                                            </div>
                                            {record.special_instructions && (
                                            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                                                <Bell className="h-3 w-3 text-indigo-500" /> {record.special_instructions}
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-8 align-top">
                                    <div className="h-10 px-4 bg-slate-100 dark:bg-white/5 rounded-xl inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                        {record.class?.name || 'Unassigned'}
                                    </div>
                                </TableCell>
                                <TableCell className="py-8 align-top">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatTime(record.checked_in_at)}</div>
                                </TableCell>
                                <TableCell className="py-8 align-top">
                                    <div className="text-sm font-bold text-slate-400 dark:text-slate-500">{formatTime(record.checked_out_at)}</div>
                                </TableCell>
                                <TableCell className="py-8 align-top">
                                    {record.checked_out_at ? (
                                    <Badge className="bg-slate-100 dark:bg-white/5 text-slate-500 border-none px-4 h-8 rounded-full text-[10px] font-bold">Checked Out</Badge>
                                    ) : (
                                    <Badge className="bg-emerald-500 text-white border-none px-4 h-8 rounded-full text-[10px] font-bold shadow-lg shadow-emerald-200 dark:shadow-none">Present</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="px-10 py-8 text-right align-top">
                                    {!record.checked_out_at && (
                                        <Button
                                        size="sm"
                                        onClick={() => handleCheckOut(record.id)}
                                        disabled={isCheckingOut}
                                        className="h-12 px-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl font-bold text-xs tracking-tight hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm"
                                    >
                                        Check Out
                                    </Button>
                                    )}
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
          </motion.div>
        </div>

        {/* Today's Report Dialog Upgrade */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
            <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 0.1, scale: 1 }}
                 className="absolute -right-12 -bottom-12"
               >
                 <TrendingUp className="w-64 h-64" />
               </motion.div>
               <div className="relative z-10 space-y-2">
                     <p className="text-[10px] font-bold text-indigo-400">Activity Report</p>
                     <DialogTitle className="text-3xl font-bold tracking-tight leading-none text-white">
                        Daily Summary
                    </DialogTitle>
                     <p className="text-xs font-medium text-slate-400 mt-4">
                        {format(new Date(), 'MMMM d, yyyy')} • {todayAttendance.length} records detected
                    </p>
               </div>
            </div>

            <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Check-ins', val: stats.todayCheckins, color: 'emerald' },
                        { label: 'Present', val: stats.currentlyPresent, color: 'indigo' },
                        { label: 'Out', val: stats.checkedOut, color: 'slate' },
                        { label: 'Late', val: stats.lateCheckouts, color: 'rose' }
                    ].map(s => (
                        <div key={s.label} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                            <p className="text-[9px] font-bold text-slate-400 tracking-tight mb-1">{s.label}</p>
                            <p className={cn(
                                "text-3xl font-bold tracking-tight",
                                s.color === 'emerald' ? 'text-emerald-500' : 
                                s.color === 'indigo' ? 'text-indigo-500' : 
                                s.color === 'rose' ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                            )}>{s.val}</p>
                        </div>
                    ))}
              </div>

              <div className="space-y-4">
                   <h4 className="text-xs font-bold text-slate-900 dark:text-white">Recent Entries</h4>
                  <div className="rounded-[2rem] border border-slate-100 dark:border-white/10 overflow-hidden">
                    <Table>
                    <TableHeader className="bg-slate-50 dark:bg-white/5">
                        <TableRow className="border-none">
                        <TableHead className="px-6 h-12 text-[9px] font-bold text-slate-400 uppercase tracking-tight">Child Name</TableHead>
                        <TableHead className="h-12 text-[9px] font-bold text-slate-400 uppercase tracking-tight">Class</TableHead>
                        <TableHead className="h-12 text-[9px] font-bold text-slate-400 uppercase tracking-tight">Arrival</TableHead>
                        <TableHead className="px-6 h-12 text-right text-[9px] font-bold text-slate-400 uppercase tracking-tight">Departure</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {todayAttendance.map((record) => (
                        <TableRow key={record.id} className="border-b border-slate-50 dark:border-white/5">
                            <TableCell className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">
                            {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown'}
                            </TableCell>
                            <TableCell className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{record.class?.name || '-'}</TableCell>
                            <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">{formatTime(record.checked_in_at)}</TableCell>
                            <TableCell className="px-6 text-right text-xs font-semibold text-slate-500">{formatTime(record.checked_out_at)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                  </div>
              </div>

               <div className="flex justify-end gap-4 pt-6">
                <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="h-14 px-8 rounded-2xl font-bold text-xs">
                  Close
                </Button>
                <Button onClick={handleExport} className="h-14 px-8 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs shadow-xl shadow-indigo-200">
                  <Download className="h-4 w-4 mr-2" />
                   Download CSV
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <CheckInDialog
          open={showCheckInDialog}
          onOpenChange={setShowCheckInDialog}
          onSuccess={() => {
            refetch();
          }}
        />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default AttendancePage;
