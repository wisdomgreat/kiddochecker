
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Download, Clock, Users, QrCode, Monitor } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import AttendanceTable from '@/components/attendance/AttendanceTable';

const CheckInOutManagement = () => {
  const { children, isLoading: childrenLoading } = useChildren();
  const { classes, isLoading: classesLoading } = useClasses();
  const { attendance, checkIn, checkOut, isCheckingIn, isCheckingOut, isLoading: attendanceLoading } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');

  // Filter out children who are already checked in today
  const availableChildren = children.filter(child => {
    const today = new Date().toISOString().split('T')[0];
    const isAlreadyCheckedIn = attendance.some(record => 
      record.child_id === child.id && 
      record.attendance_date === today && 
      !record.checked_out_at
    );
    return !isAlreadyCheckedIn;
  });

  const filteredChildren = availableChildren.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = async () => {
    if (!selectedChild) return;
    
    try {
      await checkIn({ 
        childId: selectedChild, 
        classId: selectedClass === 'no-class' || !selectedClass ? undefined : selectedClass 
      });
      setSelectedChild('');
      setSelectedClass('');
      setSearchTerm('');
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(record => 
    record.attendance_date === today
  );

  const currentlyPresent = todayAttendance.filter(record => !record.checked_out_at);
  const totalCheckedOut = todayAttendance.filter(record => record.checked_out_at);

  const openKioskMode = () => {
    window.open('/check-in-kiosk', '_blank', 'fullscreen=yes,toolbar=no,location=no,status=no,menubar=no');
  };

  if (childrenLoading || classesLoading || attendanceLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading check-in data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Check-In/Out Management</h1>
            <p className="text-muted-foreground">
              Manage child attendance and check-in/out processes for {new Date().toLocaleDateString()}.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={openKioskMode}>
              <Monitor className="h-4 w-4 mr-2" />
              Open Kiosk Mode
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">Currently Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{currentlyPresent.length}</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Total Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAttendance.length}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium ml-2">Checked Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{totalCheckedOut.length}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <QrCode className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium ml-2">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{availableChildren.length}</div>
              <p className="text-xs text-muted-foreground">To check in</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Check-In */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Check-In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Child</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Child</label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose child" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChildren.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Class (Optional)</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-class">No specific class</SelectItem>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCheckIn} 
                disabled={!selectedChild || isCheckingIn}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isCheckingIn ? 'Checking In...' : 'Check In'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance.length > 0 ? (
              <AttendanceTable
                attendance={todayAttendance}
                onCheckOut={checkOut}
                isCheckingOut={isCheckingOut}
              />
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No attendance records yet</h3>
                <p className="text-muted-foreground mb-4">Start checking in children to see attendance data</p>
                <Button onClick={openKioskMode}>
                  <Monitor className="h-4 w-4 mr-2" />
                  Open Kiosk Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CheckInOutManagement;
