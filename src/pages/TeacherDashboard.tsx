
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCards from '@/components/dashboard/StatCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, UserCheck, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { children } = useChildren();
  const { classes } = useClasses();
  const { attendance } = useAttendance();

  const currentlyPresent = attendance.filter(record => !record.checked_out_at);

  const dashboardStats = {
    totalChildren: children.length,
    totalClasses: classes.length,
    checkedIn: currentlyPresent.length,
    totalStaff: 0,
  };

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
              <GraduationCap className="h-4 w-4 mr-2" />
              Manage Classes
            </Button>
            <Button onClick={() => navigate('/check-in-out')}>
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <StatCards stats={dashboardStats} isLoading={false} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/classes-management')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">
                Classes assigned to you
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/children-management')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">
                Total students
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/check-in-out')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium ml-2">Present Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentlyPresent.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently checked in
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{classItem.name}</h3>
                      <p className="text-sm text-muted-foreground">{classItem.age_range}</p>
                      {classItem.room && (
                        <p className="text-sm text-muted-foreground">Room: {classItem.room}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {attendance.filter(a => a.class_id === classItem.id && !a.checked_out_at).length} present
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/check-in-out?class=${classItem.id}`)}
                      >
                        View Attendance
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No classes assigned yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
