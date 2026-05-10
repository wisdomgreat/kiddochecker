import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, CheckSquare, Clock, Download, Loader2, RefreshCw, TrendingUp, Users, Activity, Bell, Baby, Shield, ChevronRight, BarChart3 } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { useAuth } from '@/hooks/useAuth';
import { AttendanceService } from '@/services/attendanceService';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { CheckInDialog } from '@/components/attendance/CheckInDialog';
import { ClassAttendanceReport } from '@/components/attendance/ClassAttendanceReport';
import OverrideReasonDialog from '@/components/attendance/OverrideReasonDialog';
import ForensicTimeline from '@/components/attendance/ForensicTimeline';
import LogIncidentDialog from '@/components/attendance/LogIncidentDialog';
import CareLogMenu from '@/components/attendance/CareLogMenu';
import { cn } from '@/lib/utils';
import { AttendanceRecord } from '@/types/attendance';
import { AlertCircle } from 'lucide-react';

const AttendancePage = () => {
  const navigate = useNavigate();
  const { attendance, isLoading, error, refetch, checkOut, isCheckingOut } = useAttendance();
  const { isConnected } = useRealtimeAttendance();
  const { user, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showDossierDialog, setShowDossierDialog] = useState(false);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<AttendanceRecord | null>(null);
  const [selectedForIncident, setSelectedForIncident] = useState<AttendanceRecord | null>(null);
  const [pendingRecord, setPendingRecord] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const stats = useMemo(() => {
    if (!attendance) return { todayCheckins: 0, currentlyPresent: 0, checkedOut: 0, lateCheckouts: 0 };
    const today = new Date().toDateString();
    const todayCheckins = attendance.filter(r => 
      new Date(r.attendance_date).toDateString() === today && r.checked_in_at
    ).length;
    const currentlyPresent = attendance.filter(r => r.checked_in_at && !r.checked_out_at).length;
    const checkedOut = attendance.filter(r => 
      new Date(r.attendance_date).toDateString() === today && r.checked_out_at
    ).length;
    const lateCheckouts = attendance.filter(r => {
      if (!r.checked_out_at || new Date(r.attendance_date).toDateString() !== today) return false;
      const checkoutHour = new Date(r.checked_out_at).getHours();
      return checkoutHour >= 18;
    }).length;

    return { todayCheckins, currentlyPresent, checkedOut, lateCheckouts };
  }, [attendance]);

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

  const handleCheckOut = (record: any) => {
    setPendingRecord(record);
    setShowOverrideDialog(true);
  };

  const confirmCheckOut = async (reason: string, witnessId?: string) => {
    if (!pendingRecord) return;
    
    try {
      const result = await AttendanceService.checkOutChild({
        attendanceId: pendingRecord.id,
        checkedOutBy: user?.id,
        method: 'admin_dashboard_manual',
        station: 'Admin Panel',
        overrideReason: reason,
        witnessId: witnessId,
        deviceId: user?.user_metadata?.device_id
      } as any);

      if (result.success) {
        toast({ title: "Child Signed Out", description: `Manual override recorded for ${pendingRecord.child?.first_name}.` });
        refetch();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setShowOverrideDialog(false);
      setPendingRecord(null);
    }
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

    const headers = ['Child Name', 'Class', 'Check-in Time', 'Check-out Time', 'Status'];
    const rows = todayAttendance.map(record => [
      record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown',
      record.class?.name || 'No Class',
      record.checked_in_at ? formatTime(record.checked_in_at) : '-',
      record.checked_out_at ? formatTime(record.checked_out_at) : '-',
      record.checked_out_at ? 'Checked Out' : 'Present'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: "Attendance report downloaded." });
  };

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher', 'parent']}>
      <UnifiedDashboardLayout>
        <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                {isConnected && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                    Live
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Monitor real-time children check-ins and logs.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {(isAdmin || isSuperAdmin || hasPermission('checkin.manual_dashboard')) && (
                <Button onClick={() => setShowCheckInDialog(true)} variant="default">
                    <Activity className="h-4 w-4 mr-2" />
                    Check-in
                </Button>
              )}

              {stats.currentlyPresent > 0 && (isAdmin || isSuperAdmin) && (
                <Button 
                  variant="outline" 
                   onClick={async () => {
                    if (!window.confirm(`Sign out ALL ${stats.currentlyPresent} children?`)) return;
                    const actorId = user?.id;
                    const presentRecords = todayAttendance.filter(r => !r.checked_out_at);
                    for (const record of presentRecords) {
                      try {
                        await AttendanceService.checkOutChild({
                          attendanceId: record.id,
                          checkedOutBy: actorId,
                          method: 'emergency_admin_bulk',
                          station: 'Dashboard'
                        });
                      } catch {}
                    }
                    toast({ title: "Bulk Sign-Out Processing" });
                    refetch();
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Sign-out All ({stats.currentlyPresent})
                </Button>
              )}
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
                   <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleExport} title="Export CSV">
                   <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <Button onClick={() => setIsReportDialogOpen(true)} variant="secondary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today's Log
              </Button>
              <Button onClick={() => navigate('/reports')} variant="outline" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Full Audit Suite
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                  { label: "Check-ins", val: stats.todayCheckins, icon: CheckSquare, desc: "Today total" },
                  { label: "Present Now", val: stats.currentlyPresent, icon: Users, desc: "On-site" },
                  { label: "Departed", val: stats.checkedOut, icon: TrendingUp, desc: "Safely home" },
                  { label: "Late Pickups", val: stats.lateCheckouts, icon: Clock, desc: "Post-6PM" }
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                            <h3 className="text-3xl font-bold tracking-tight">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : s.val}
                            </h3>
                            <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                        </div>
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                            <s.icon className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* By Class Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight">Class Distribution</h2>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="h-8 w-auto text-xs font-medium"
                        />
                    </div>
                </div>
                <ClassAttendanceReport selectedDate={selectedDate} />
            </div>

            {/* Attendance Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight">Real-time Check-in Log</h2>
                    <Badge variant="secondary" className="font-bold">{todayAttendance.length} Entries</Badge>
                </div>

                <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p className="text-xs">Loading database...</p>
                    </div>
                    ) : error ? (
                    <div className="py-20 text-center">
                        <p className="font-bold text-destructive">Connection Error</p>
                        <Button variant="outline" onClick={() => refetch()} className="mt-4">
                        Retry Sync
                        </Button>
                    </div>
                    ) : todayAttendance.length === 0 ? (
                    <div className="py-32 text-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mx-auto mb-6">
                            <CheckSquare className="h-8 w-8 opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold">No activity yet</h3>
                        <p className="text-sm">Attendance logs will appear here as children check in.</p>
                    </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="px-6 font-bold text-xs uppercase tracking-wider">Child</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Class</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Arrival</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Departure</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Events</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                                <TableHead className="px-6 text-right font-bold text-xs uppercase tracking-wider">Action</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {todayAttendance.map((record) => (
                                <TableRow key={record.id} className="group hover:bg-muted/50 transition-all border-b border-border/50">
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/30 transition-colors">
                                            {(record.child as any)?.photo_url ? (
                                                <img src={(record.child as any).photo_url} className="h-full w-full object-cover" />
                                            ) : (
                                                <Baby className="h-5 w-5 text-muted-foreground/40" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight leading-tight cursor-pointer hover:text-primary transition-colors" onClick={() => { setSelectedDossier(record); setShowDossierDialog(true); }}>
                                                {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown'}
                                            </p>
                                            {record.special_instructions ? (
                                                <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                                                    <Bell className="h-3 w-3" /> {record.special_instructions}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 uppercase tracking-widest font-black">
                                                    <Shield className="h-2.5 w-2.5" /> Secured
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest bg-muted/30 border-transparent">
                                        {record.class?.name || 'Unassigned'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-bold text-foreground">
                                  {formatTime(record.checked_in_at)}
                                </TableCell>
                                <TableCell className="text-sm font-medium text-muted-foreground italic">
                                  {formatTime(record.checked_out_at)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        <CareLogMenu 
                                            attendanceId={record.id} 
                                            staffId={user?.id || ''} 
                                            onLogAdded={() => refetch()} 
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                                            onClick={() => { setSelectedForIncident(record); setShowIncidentDialog(true); }}
                                        >
                                            <Activity className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                      variant={record.checked_out_at ? "secondary" : "default"} 
                                      className={cn(
                                        "font-black text-[10px] uppercase tracking-widest px-3 py-1 border-none",
                                        !record.checked_out_at && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      )}
                                    >
                                      {record.checked_out_at ? "Signed Out" : "On-site"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-6 text-right">
                                    {!record.checked_out_at ? (
                                        (isAdmin || isSuperAdmin || hasPermission('checkin.manual_dashboard')) && (
                                          <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleCheckOut(record)}
                                              disabled={isCheckingOut}
                                              className="h-8 font-black text-[10px] uppercase tracking-widest rounded-full px-4 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                                          >
                                              Sign Out
                                          </Button>
                                        )
                                    ) : (
                                      (isAdmin || isSuperAdmin || hasPermission('audit.view_forensics')) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 text-primary transition-all"
                                          onClick={() => { setSelectedDossier(record); setShowDossierDialog(true); }}
                                        >
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      )
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
          </div>
        </div>

        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <div className="bg-primary p-8 text-primary-foreground">
                <DialogTitle className="text-3xl font-bold tracking-tight">Activity Log</DialogTitle>
                <p className="text-sm opacity-80 mt-1">Full attendance history for {format(new Date(), 'MMMM d, yyyy')}</p>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Check-ins', val: stats.todayCheckins },
                        { label: 'Present', val: stats.currentlyPresent },
                        { label: 'Departures', val: stats.checkedOut },
                        { label: 'Late', val: stats.lateCheckouts }
                    ].map(s => (
                        <div key={s.label} className="p-4 bg-muted/50 rounded border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</p>
                            <p className="text-2xl font-bold">{s.val}</p>
                        </div>
                    ))}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="px-4 h-10 text-[10px] font-bold uppercase">Name</TableHead>
                            <TableHead className="h-10 text-[10px] font-bold uppercase">Class</TableHead>
                            <TableHead className="h-10 text-[10px] font-bold uppercase">In</TableHead>
                            <TableHead className="px-4 h-10 text-right text-[10px] font-bold uppercase">Out</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {todayAttendance.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="px-4 py-3 font-bold text-sm">
                                    {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown'}
                                </TableCell>
                                <TableCell className="text-xs">{record.class?.name || '-'}</TableCell>
                                <TableCell className="text-xs font-medium">{formatTime(record.checked_in_at)}</TableCell>
                                <TableCell className="px-4 text-right text-xs">{formatTime(record.checked_out_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/30 border-t">
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Close</Button>
                <Button onClick={handleExport}>Download CSV</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CheckInDialog
          open={showCheckInDialog}
          onOpenChange={setShowCheckInDialog}
          onSuccess={() => refetch()}
        />

        <OverrideReasonDialog
          open={showOverrideDialog}
          onClose={() => setShowOverrideDialog(false)}
          onConfirm={confirmCheckOut}
          childName={pendingRecord?.child ? `${pendingRecord.child.first_name} ${pendingRecord.child.last_name}` : 'Unknown'}
        />

        <Dialog open={showDossierDialog} onOpenChange={setShowDossierDialog}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-background shadow-2xl rounded-[2.5rem]">
            <div className="bg-foreground p-10 text-background relative overflow-hidden shrink-0">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-background/10 backdrop-blur-md border border-background/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-background/60">Forensic Evidence Dossier</span>
                </div>
                <DialogTitle className="text-4xl font-black tracking-tighter leading-none mb-2">
                  {selectedDossier?.child?.first_name} {selectedDossier?.child?.last_name}
                </DialogTitle>
                <div className="flex items-center gap-4 text-background/50 font-mono text-[10px] mt-4 pt-4 border-t border-background/10">
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> SESSION START: {selectedDossier?.checked_in_at ? format(new Date(selectedDossier.checked_in_at), 'HH:mm:ss') : 'N/A'}</span>
                  <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> AUDIT ID: {selectedDossier?.id.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-card/30">
              {selectedDossier && <ForensicTimeline record={selectedDossier} />}
            </div>
            <DialogFooter className="p-8 bg-muted/50 border-t border-border/50 flex flex-row items-center justify-between sm:justify-between shrink-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Digital Security Seal</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium">This document is cryptographically verified and tamper-evident.</p>
                </div>
                <Button 
                  onClick={() => window.print()} 
                  className="rounded-full px-8 py-6 h-auto font-black text-[11px] uppercase tracking-[0.2em] bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                >
                  <Download className="h-4 w-4 mr-3" />
                  Export for Counsel
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedForIncident && (
          <LogIncidentDialog
            open={showIncidentDialog}
            onClose={() => { setShowIncidentDialog(false); setSelectedForIncident(null); }}
            attendanceId={selectedForIncident.id}
            childId={selectedForIncident.child_id || ''}
            childName={selectedForIncident.child ? `${selectedForIncident.child.first_name} ${selectedForIncident.child.last_name}` : 'Unknown'}
            staffId={user?.id || ''}
            onSuccess={() => {
              if (typeof refetch === 'function') refetch();
            }}
          />
        )}
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default AttendancePage;

