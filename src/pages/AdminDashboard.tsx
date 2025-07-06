import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  Calendar,
  MessageSquare,
  Building,
  Monitor,
  UserPlus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Stats queries
  const { data: userCount = 0 } = useQuery({
    queryKey: ['user-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: childrenCount = 0 } = useQuery({
    queryKey: ['children-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: classesCount = 0 } = useQuery({
    queryKey: ['classes-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: todayAttendance = 0 } = useQuery({
    queryKey: ['today-attendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('attendance_date', today)
        .not('checked_in_at', 'is', null);
      return count || 0;
    }
  });

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      path: '/users-management',
      color: 'bg-blue-500'
    },
    {
      title: 'Staff Management',
      description: 'Manage staff and teachers',
      icon: UserCheck,
      path: '/staff-management',
      color: 'bg-green-500'
    },
    {
      title: 'Classes Management',
      description: 'Manage classes and assignments',
      icon: BookOpen,
      path: '/classes-management',
      color: 'bg-purple-500'
    },
    {
      title: 'Check-In/Out',
      description: 'Manage attendance system',
      icon: ClipboardCheck,
      path: '/check-in-out',
      color: 'bg-orange-500'
    },
    {
      title: 'Reports',
      description: 'View attendance and system reports',
      icon: BarChart3,
      path: '/reports',
      color: 'bg-red-500'
    },
    {
      title: 'Calendar',
      description: 'Manage events and schedules',
      icon: Calendar,
      path: '/calendar',
      color: 'bg-indigo-500'
    },
    {
      title: 'Family Connect',
      description: 'Communication system',
      icon: MessageSquare,
      path: '/family-connect',
      color: 'bg-pink-500'
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-500'
    },
    {
      title: 'Organization Setup',
      description: 'Configure organization',
      icon: Building,
      path: '/organization-setup',
      color: 'bg-cyan-500'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Link to="/parent-registration">
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Parent Registration
              </Button>
            </Link>
            <Button onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{childrenCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classesCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAttendance}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path}>
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database: Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Authentication: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Check-in System: Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
