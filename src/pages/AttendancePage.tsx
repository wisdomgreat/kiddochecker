import { useState, useMemo } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckSquare, TrendingUp, Calendar, Download, Loader2, Clock, RefreshCw } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const AttendancePage = () => {
  const { attendance, isLoading, error, refetch, checkOut, isCheckingOut } = useAttendance();
  const { isConnected } = useRealtimeAttendance();
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!attendance) return { todayCheckins: 0, currentlyPresent: 0, checkedOut: 0, lateCheckouts: 0 };
    
    const today = new Date().toDateString();
    const todayRecords = attendance.filter(r => 
      new Date(r.attendance_date).toDateString() === today
    );
    
    const checkedIn = todayRecords.filter(r => r.checked_in_at).length;
    const present = todayRecords.filter(r => r.checked_in_at && !r.checked_out_at).length;
    const checkedOut = todayRecords.filter(r => r.checked_out_at).length;
    
    // Late checkouts: checked out after 6 PM
    const lateCheckouts = todayRecords.filter(r => {
      if (!r.checked_out_at) return false;
      const checkoutHour = new Date(r.checked_out_at).getHours();
      return checkoutHour >= 18;
    }).length;
    
    return { 
      todayCheckins: checkedIn, 
      currentlyPresent: present,
      checkedOut,
      lateCheckouts 
    };
  }, [attendance]);

  // Get today's attendance records
  const todayAttendance = useMemo(() => {
    if (!attendance) return [];
    const today = new Date().toDateString();
    return attendance.filter(r => 
      new Date(r.attendance_date).toDateString() === today
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Attendance Tracking</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Monitor attendance and check-in history
                {isConnected && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse" />
                    Live
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.todayCheckins}
                </div>
                <p className="text-xs text-muted-foreground">Total checked in today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Present</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.currentlyPresent}
                </div>
                <p className="text-xs text-muted-foreground">Still checked in</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.checkedOut}
                </div>
                <p className="text-xs text-muted-foreground">Completed today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Check-outs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.lateCheckouts}
                </div>
                <p className="text-xs text-muted-foreground">After 6:00 PM</p>
              </CardContent>
            </Card>
          </div>

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
                <div className="text-center py-8 text-destructive">
                  <p>Error loading attendance data</p>
                  <Button variant="outline" onClick={() => refetch()} className="mt-2">
                    Retry
                  </Button>
                </div>
              ) : todayAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records for today</p>
                  <p className="text-sm">Check-ins will appear here in real-time</p>
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
                        <TableCell className="font-medium">
                          {record.child ? 
                            `${record.child.first_name} ${record.child.last_name}` : 
                            'Unknown Child'
                          }
                        </TableCell>
                        <TableCell>{record.class?.name || 'No Class'}</TableCell>
                        <TableCell>{formatTime(record.checked_in_at)}</TableCell>
                        <TableCell>{formatTime(record.checked_out_at)}</TableCell>
                        <TableCell>
                          {record.checked_out_at ? (
                            <Badge variant="secondary">Checked Out</Badge>
                          ) : (
                            <Badge className="bg-green-600">Present</Badge>
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
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default AttendancePage;
