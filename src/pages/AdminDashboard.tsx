
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Settings, BarChart3, Shield, Calendar, MessageSquare } from 'lucide-react';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useRealDevices } from '@/hooks/useRealDevices';

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: users = [] } = useAllUsers();
  const { devices = [] } = useRealDevices();

  useEffect(() => {
    if (!loading && (!user || !['admin', 'super_admin'].includes(userRole || ''))) {
      navigate('/landing');
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.is_online).length;

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage all users and their roles',
      icon: Users,
      action: () => navigate('/user-management'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Staff Management',
      description: 'Manage staff members and teachers',
      icon: UserPlus,
      action: () => navigate('/staff-management'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Device Management',
      description: 'Manage check-in kiosks and devices',
      icon: Settings,
      action: () => navigate('/device-management'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Reports & Analytics',
      description: 'View attendance and system reports',
      icon: BarChart3,
      action: () => navigate('/reports'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.email}. Manage your organization from here.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-600">Super Admin Access</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onlineDevices}</div>
              <p className="text-xs text-muted-foreground">
                {totalDevices} total devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0 pending check-outs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Good</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System started successfully</span>
                <span className="text-xs text-gray-400 ml-auto">Just now</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Admin dashboard loaded</span>
                <span className="text-xs text-gray-400 ml-auto">1 minute ago</span>
              </div>
              <div className="text-center py-8 text-gray-500">
                <p>More activity will appear here as users interact with the system</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
