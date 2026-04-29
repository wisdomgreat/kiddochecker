
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Download } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import AttendanceTable from '@/components/attendance/AttendanceTable';

const CheckInManagement = () => {
  const { children, isLoading: childrenLoading } = useChildren();
  const { classes, isLoading: classesLoading } = useClasses();
  const { attendance, checkIn, checkOut, isCheckingIn, isCheckingOut, isLoading: attendanceLoading } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');

  const availableChildren = children.filter(child => {
    const isAlreadyCheckedIn = attendance.some(record => 
      record.child_id === child.id && !record.checked_out_at
    );
    return !isAlreadyCheckedIn;
  });

  const filteredChildren = availableChildren.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = () => {
    if (selectedChild) {
      checkIn({ 
        childId: selectedChild, 
        classId: selectedClass === 'no-class' ? undefined : selectedClass 
      });
      setSelectedChild('');
      setSelectedClass('');
    }
  };

  const todayAttendance = attendance.filter(record => 
    record.attendance_date === new Date().toISOString().split('T')[0]
  );

  const currentlyPresent = todayAttendance.filter(record => !record.checked_out_at);

  if (childrenLoading || classesLoading || attendanceLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading check-in data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Badge className="bg-green-600 text-white">Present</Badge>
            <CardTitle className="text-sm font-medium ml-2">Currently Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentlyPresent.length}</div>
            <p className="text-xs text-muted-foreground">Active now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Badge variant="secondary">Out</Badge>
            <CardTitle className="text-sm font-medium ml-2">Checked Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {todayAttendance.length - currentlyPresent.length}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="h-4 w-4 bg-purple-600 rounded-full" />
            <CardTitle className="text-sm font-medium ml-2">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{availableChildren.length}</div>
            <p className="text-xs text-muted-foreground">Children</p>
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
      <AttendanceTable
        attendance={todayAttendance}
        onCheckOut={checkOut}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
};

export default CheckInManagement;

