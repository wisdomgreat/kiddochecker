
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import AttendanceTable from '@/components/attendance/AttendanceTable';

const TeacherDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { attendance, checkOut, isCheckingOut } = useAttendance();
  const { classes } = useClasses();

  console.log("TeacherDashboard - Current user:", user?.id, "Role:", userRole);

  const todayAttendance = attendance.filter(record => 
    record.attendance_date === new Date().toISOString().split('T')[0]
  );
  
  const currentlyPresent = todayAttendance.filter(record => !record.checked_out_at);
  const totalCheckedIn = todayAttendance.length;
  const totalCheckedOut = todayAttendance.filter(record => record.checked_out_at).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your classes and track attendance.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/classes-management')}>
              <Plus className="h-4 w-4 mr-2" />
              Manage Classes
            </Button>
            <Button onClick={() => navigate('/check-in-out')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check-in/Out
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Total Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCheckedIn}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">Currently Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{currentlyPresent.length}</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium ml-2">Checked Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalCheckedOut}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium ml-2">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>
        </div>

        {/* My Classes */}
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((classItem) => {
                  const classAttendance = currentlyPresent.filter(
                    record => record.class_id === classItem.id
                  ).length;
                  
                  return (
                    <Card key={classItem.id} className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/classes-management?classId=${classItem.id}`)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Present:</span>
                            <span className="font-medium">{classAttendance}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Capacity:</span>
                            <span className="font-medium">{classItem.capacity || 'Unlimited'}</span>
                          </div>
                          {classItem.room && (
                            <div className="flex justify-between text-sm">
                              <span>Room:</span>
                              <span className="font-medium">{classItem.room}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No classes assigned yet.</p>
                <Button onClick={() => navigate('/classes-management')}>
                  View All Classes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceTable
              attendance={todayAttendance}
              onCheckOut={checkOut}
              isCheckingOut={isCheckingOut}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
