
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  QrCode, 
  Search,
  UserCheck,
  UserX,
  School,
  Calendar,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { AttendanceService } from '@/services/attendanceService';
import { useToast } from '@/hooks/useToast';

const ComprehensiveStaffDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const { attendance, refetch } = useAttendance();
  const { classes } = useClasses();
  const { toast } = useToast();

  const todaysAttendance = attendance.filter(record => 
    new Date(record.attendance_date).toDateString() === new Date().toDateString()
  );

  const checkedInChildren = todaysAttendance.filter(record => 
    record.checked_in_at && !record.checked_out_at
  );

  const checkedOutChildren = todaysAttendance.filter(record => 
    record.checked_out_at
  );

  const handleCheckOut = async (attendanceId: string, childName: string) => {
    try {
      const result = await AttendanceService.checkOutChild({ attendanceId });
      if (result.success) {
        toast({
          title: "Success",
          description: `${childName} has been checked out`,
        });
        refetch();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to check out child",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check out child",
        variant: "destructive",
      });
    }
  };

  const filteredCheckedInChildren = checkedInChildren.filter(record => {
    const childName = `${record.child?.first_name} ${record.child?.last_name}`.toLowerCase();
    const matchesSearch = searchTerm === '' || childName.includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === '' || record.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Check-in/Check-out management and attendance tracking
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Now</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkedInChildren.length}</div>
            <p className="text-xs text-muted-foreground">Currently checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{checkedOutChildren.length}</div>
            <p className="text-xs text-muted-foreground">Already departed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAttendance.length}</div>
            <p className="text-xs text-muted-foreground">Total check-ins today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Classes available</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="checkin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checkin">Check-in/Out</TabsTrigger>
          <TabsTrigger value="present">Currently Present</TabsTrigger>
          <TabsTrigger value="history">Today's Activity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Check-in */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Quick Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">QR Code Scanner</h3>
                  <p className="text-muted-foreground mb-4">
                    Scan a child's QR code to check them in quickly
                  </p>
                  <Button>
                    <QrCode className="h-4 w-4 mr-2" />
                    Open Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Check-in */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Manual Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input 
                    placeholder="Search by child name..." 
                    className="w-full"
                  />
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Search Children
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground text-center py-4">
                  Type a child's name to find and check them in manually
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="present" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search children..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md bg-background"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Currently Present Children */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Currently Present ({filteredCheckedInChildren.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredCheckedInChildren.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {record.child?.first_name} {record.child?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {record.class?.name || 'No class assigned'} • Checked in at{' '}
                          {new Date(record.checked_in_at || '').toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckOut(
                        record.id, 
                        `${record.child?.first_name} ${record.child?.last_name}`
                      )}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Check Out
                    </Button>
                  </div>
                ))}
                
                {filteredCheckedInChildren.length === 0 && (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No children present</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedClass 
                        ? 'No children match your search criteria'
                        : 'No children are currently checked in'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Activity ({todaysAttendance.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.checked_out_at 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {record.checked_out_at ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {record.child?.first_name} {record.child?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {record.class?.name || 'No class assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={record.checked_out_at ? "secondary" : "default"}>
                        {record.checked_out_at ? "Departed" : "Present"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        In: {new Date(record.checked_in_at || '').toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {record.checked_out_at && (
                          <> | Out: {new Date(record.checked_out_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                
                {todaysAttendance.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No activity today</h3>
                    <p className="text-muted-foreground">
                      Attendance records will appear here as children check in.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Daily Summary</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Total Check-ins:</span>
                      <span className="font-medium">{todaysAttendance.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currently Present:</span>
                      <span className="font-medium text-green-600">{checkedInChildren.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Already Departed:</span>
                      <span className="font-medium text-blue-600">{checkedOutChildren.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Daily Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Weekly Summary
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Class Attendance
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveStaffDashboard;

