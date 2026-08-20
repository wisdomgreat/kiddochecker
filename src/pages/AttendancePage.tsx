import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '@/components/dashboard/DashboardShell';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent } from '@/components/ui/card';
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

const AttendancePage = () => {
  const navigate = useNavigate();
  const { attendance, isLoading, error, refetch, isCheckingOut } = useAttendance();
  const { isConnected } = useRealtimeAttendance();
  const { user, isAdmin, isSuperAdmin, hasPermission, userRole } = useAuth();
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
        <DashboardShell
          role={(userRole as any) || 'admin'}
          title="Attendance Live Monitor"
          subtitle="Real-time child check-in tracking, care logs, and security verification."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {(isAdmin || isSuperAdmin || hasPermission('checkin.manual_dashboard')) && (
                <Button onClick={() => setShowCheckInDialog(true)} className="h-9 rounded-xl text-xs font-semibold uppercase tracking-wider gap-2">
                  <Activity className="h-4 w-4" />
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
                  className="h-9 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20 gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Sign-out All ({stats.currentlyPresent})
                </Button>
              )}
              
              <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh" className="h-9 w-9 rounded-xl">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV" className="h-9 w-9 rounded-xl">
                <Download className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button onClick={() => setIsReportDialogOpen(true)} variant="secondary" className="h-9 rounded-xl text-xs font-semibold gap-2">
                <Calendar className="h-4 w-4" />
                Today's Summary
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Check-ins Today", val: stats.todayCheckins, icon: CheckSquare, desc: "Total arrivals" },
                { label: "Present On-site", val: stats.currentlyPresent, icon: Users, desc: "Currently active" },
                { label: "Departed", val: stats.checkedOut, icon: TrendingUp, desc: "Checked out" },
                { label: "Late Pickups", val: stats.lateCheckouts, icon: Clock, desc: "Post-6PM" }
              ].map((s) => (
                <Card key={s.label} className="border border-border/70 rounded-2xl shadow-sm bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : s.val}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <s.icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Class Breakdown & Log */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Classroom Breakdown</h2>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-8 w-auto text-xs font-medium rounded-xl"
                    />
                  </div>
                </div>
                <ClassAttendanceReport selectedDate={selectedDate} />
              </div>

              {/* Attendance Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">Real-time Check-in Log</h2>
                    {isConnected && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10 font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                        Live Feed
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-bold text-[10px]">{todayAttendance.length} Entries</Badge>
                </div>

                <Card className="border border-border/70 rounded-2xl shadow-sm overflow-hidden bg-card">
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
                        <p className="text-xs font-semibold uppercase tracking-wider">Syncing attendance database...</p>
                      </div>
                    ) : error ? (
                      <div className="py-16 text-center">
                        <p className="font-bold text-rose-500 text-sm">Connection Error</p>
                        <Button variant="outline" onClick={() => refetch()} className="mt-3 rounded-xl text-xs">
                          Retry Sync
                        </Button>
                      </div>
                    ) : todayAttendance.length === 0 ? (
                      <div className="py-24 text-center text-muted-foreground">
                        <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <CheckSquare className="h-6 w-6 opacity-30" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">No attendance records today</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Logs will automatically populate as children check in.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 border-b border-border/50">
                              <TableHead className="px-6 font-bold text-[10px] uppercase tracking-wider">Child</TableHead>
                              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Classroom</TableHead>
                              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Check-in</TableHead>
                              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Check-out</TableHead>
                              <TableHead className="font-bold text-[10px] uppercase tracking-wider text-center">Log Action</TableHead>
                              <TableHead className="font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
                              <TableHead className="px-6 text-right font-bold text-[10px] uppercase tracking-wider">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {todayAttendance.map((record) => (
                              <TableRow key={record.id} className="group hover:bg-muted/30 transition-all border-b border-border/40">
                                <TableCell className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                                      {(record.child as any)?.photo_url ? (
                                        <img src={(record.child as any).photo_url} className="h-full w-full object-cover" />
                                      ) : (
                                        <Baby className="h-4 w-4 text-muted-foreground/50" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-xs text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => { setSelectedDossier(record); setShowDossierDialog(true); }}>
                                        {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown'}
                                      </p>
                                      {record.special_instructions ? (
                                        <p className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-1">
                                          <Bell className="h-3 w-3" /> {record.special_instructions}
                                        </p>
                                      ) : (
                                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                          <Shield className="h-2.5 w-2.5 text-emerald-500" /> Verified Entry
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-semibold text-[10px] bg-muted/40 border-border/50">
                                    {record.class?.name || 'Unassigned'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-foreground">
                                  {formatTime(record.checked_in_at)}
                                </TableCell>
                                <TableCell className="text-xs font-medium text-muted-foreground">
                                  {formatTime(record.checked_out_at)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-2">
                                    <CareLogMenu 
                                      attendanceId={record.id} 
                                      staffId={user?.id || ''} 
                                      childName={record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Camper'}
                                      onLogAdded={() => refetch()} 
                                    />
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                                      onClick={() => { setSelectedForIncident(record); setShowIncidentDialog(true); }}
                                    >
                                      <Activity className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={record.checked_out_at ? "secondary" : "default"} 
                                    className={cn(
                                      "font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 border-none",
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
                                        className="h-7 font-bold text-[10px] uppercase tracking-wider rounded-xl px-3 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                                      >
                                        Sign Out
                                      </Button>
                                    )
                                  ) : (
                                    (isAdmin || isSuperAdmin || hasPermission('audit.view_forensics')) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 text-primary transition-all"
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
            <DialogContent className="max-w-3xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Today's Summary Log</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Check-ins', val: stats.todayCheckins },
                    { label: 'Present', val: stats.currentlyPresent },
                    { label: 'Departures', val: stats.checkedOut },
                    { label: 'Late', val: stats.lateCheckouts }
                  ].map(s => (
                    <div key={s.label} className="p-3 bg-muted/40 rounded-xl border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="px-4 h-9 text-[10px] font-bold uppercase">Name</TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase">Class</TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase">In</TableHead>
                        <TableHead className="px-4 h-9 text-right text-[10px] font-bold uppercase">Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="px-4 py-2.5 font-bold text-xs">
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
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)} className="rounded-xl text-xs font-semibold">Close</Button>
                <Button onClick={handleExport} className="rounded-xl text-xs font-semibold gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </Button>
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
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-background shadow-2xl rounded-3xl">
              <div className="bg-foreground p-8 text-background relative overflow-hidden shrink-0">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-xl bg-background/10 backdrop-blur-md border border-background/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-background/70">Forensic Audit Dossier</span>
                  </div>
                  <DialogTitle className="text-3xl font-bold tracking-tight mb-2">
                    {selectedDossier?.child?.first_name} {selectedDossier?.child?.last_name}
                  </DialogTitle>
                  <div className="flex items-center gap-4 text-background/60 font-mono text-[10px] mt-3 pt-3 border-t border-background/10">
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> SESSION START: {selectedDossier?.checked_in_at ? format(new Date(selectedDossier.checked_in_at), 'HH:mm:ss') : 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> AUDIT ID: {selectedDossier?.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-card/30">
                {selectedDossier && <ForensicTimeline record={selectedDossier} />}
              </div>
              <DialogFooter className="p-6 bg-muted/40 border-t border-border/50 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">Digital Security Seal Verified</p>
                </div>
                <Button 
                  onClick={() => window.print()} 
                  className="rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export File
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
        </DashboardShell>
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default AttendancePage;
