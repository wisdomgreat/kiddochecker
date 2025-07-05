
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCards from '@/components/dashboard/StatCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, UserCheck, AlertTriangle, Plus, FileText, Clock } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import useUserRoles from '@/hooks/useUserRoles';

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { children } = useChildren();
  const { classes } = useClasses();
  const { data: users } = useUserRoles();

  console.log("AdminDashboard - Current user:", user?.id, "Role:", userRole);

  const dashboardStats = {
    totalChildren: children?.length || 0,
    totalClasses: classes?.length || 0,
    checkedIn: stats?.checkedInToday || 0,
    totalStaff: users?.filter(u => ['admin', 'teacher', 'staff', 'super_admin'].includes(u.role)).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/users')}>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button onClick={() => navigate('/reports')}>
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <StatCards stats={dashboardStats} isLoading={statsLoading} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/children')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total registered children
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/classes-management')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active classes
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/staff')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium ml-2">Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => ['admin', 'teacher', 'staff', 'super_admin'].includes(u.role)).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Staff members
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/check-in-out')}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium ml-2">Check-in/Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.checkedInToday || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently present
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Class Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <span>Loading...</span>
                </div>
              ) : stats?.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <div className="flex-1">
                        <p>{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Status */}
          <Card>
            <CardHeader>
              <CardTitle>Class Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <span>Loading...</span>
                </div>
              ) : classes && classes.length > 0 ? (
                <div className="space-y-4">
                  {classes.slice(0, 5).map((classItem: any) => (
                    <div key={classItem.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-xs text-muted-foreground">{classItem.room || 'No room assigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          0/{classItem.capacity || '∞'}
                        </p>
                        <p className="text-xs text-muted-foreground">present</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No classes available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
