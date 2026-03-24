import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CheckSquare, Clock, Download, Loader2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { useAuth } from '@/context/AuthContext';
import { AttendanceService } from '@/services/attendanceService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckInDialog } from '@/components/attendance/CheckInDialog';
import { ClassAttendanceReport } from '@/components/attendance/ClassAttendanceReport';

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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Attendance Tracking
                {isConnected && (
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5 animate-pulse" />
                    Live
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor attendance and check-in history
              </p>
            </div>
            <div className="flex gap-2 flex-wrap lg:justify-end">
              <Button onClick={() => setShowCheckInDialog(true)}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Manual Check-In
              </Button>
              {stats.currentlyPresent > 0 && (isAdmin || isSuperAdmin) && (
                <Button 
                  variant="outline" 
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
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
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Sign-Out All({stats.currentlyPresent})
                </Button>
              )}
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsReportDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Today's Report
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
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
              <Card className="vcard-accent bg-emerald-50 dark:bg-emerald-500/5 border-none p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Today's Check-ins</p>
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-emerald-900 dark:text-emerald-300">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.todayCheckins}
                </h3>
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Total entries today</p>
              </Card>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="vcard-accent-blue bg-indigo-50 dark:bg-indigo-500/5 border-none p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Currently Present</p>
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-indigo-900 dark:text-indigo-300">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.currentlyPresent}
                </h3>
                <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest mt-1">Still in session</p>
              </Card>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="vcard-accent bg-slate-100 dark:bg-white/5 border-none p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Checked Out</p>
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.checkedOut}
                </h3>
                <p className="text-[10px] font-bold text-slate-500/60 uppercase tracking-widest mt-1">Completed today</p>
              </Card>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="vcard-accent-blue bg-amber-50 dark:bg-amber-500/5 border-none p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Late Check-outs</p>
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-amber-900 dark:text-amber-300">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.lateCheckouts}
                </h3>
                <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mt-1">After 6:00 PM</p>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filter Reports: </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 flex h-9 w-auto rounded-md border border-input bg-transparent text-sm"
              />
            </div>

            {/* Class Attendance Report */}
            <ClassAttendanceReport selectedDate={selectedDate} />

            {/* Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="py-12 text-left">
                    <p className="text-lg font-semibold text-destructive">Error loading attendance data</p>
                    <p className="text-muted-foreground mt-1 mb-4">We couldn't retrieve the latest attendance records.</p>
                    <Button variant="outline" onClick={() => refetch()} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Retry loading
                    </Button>
                  </div>
                ) : todayAttendance.length === 0 ? (
                  <div className="py-16 text-left max-w-md">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                      <CheckSquare className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No attendance records for today</h3>
                    <p className="text-slate-500 mt-2">Check-ins will appear here automatically in real-time as parents and staff use the kiosk.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Child Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Check-out Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium align-top">
                            <div>
                              {record.child ?
                                `${record.child.first_name} ${record.child.last_name}` :
                                'Unknown Child'
                              }
                            </div>
                            {record.special_instructions && (
                              <div className="text-xs text-muted-foreground bg-muted/50 border border-muted-foreground/10 p-2.5 rounded-xl mt-2 leading-relaxed shadow-sm">
                                <span className="font-black text-indigo-600 uppercase tracking-widest text-[10px] mr-1.5">Note:</span> {record.special_instructions}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{record.class?.name || 'No Class'}</TableCell>
                          <TableCell>{formatTime(record.checked_in_at)}</TableCell>
                          <TableCell>{formatTime(record.checked_out_at)}</TableCell>
                          <TableCell>
                            {record.checked_out_at ? (
                              <Badge variant="secondary" className="px-3 h-6 rounded-full text-[10px] font-black uppercase tracking-widest">Checked Out</Badge>
                            ) : (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 h-6 rounded-full text-[10px] font-black uppercase tracking-widest">Present</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!record.checked_out_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckOut(record.id)}
                                disabled={isCheckingOut}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                {isCheckingOut ? 'Processing...' : 'Check Out'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Today's Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Today's Attendance Report - {format(new Date(), 'MMMM d, yyyy')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                  <p className="text-2xl font-bold">{stats.todayCheckins}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Currently Present</p>
                  <p className="text-2xl font-bold">{stats.currentlyPresent}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold">{stats.checkedOut}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Late Check-outs</p>
                  <p className="text-2xl font-bold">{stats.lateCheckouts}</p>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>In</TableHead>
                      <TableHead>Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.child ?
                            `${record.child.first_name} ${record.child.last_name}` :
                            'Unknown'
                          }
                        </TableCell>
                        <TableCell>{record.class?.name || '-'}</TableCell>
                        <TableCell>{formatTime(record.checked_in_at)}</TableCell>
                        <TableCell>{formatTime(record.checked_out_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
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
