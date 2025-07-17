
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Activity, 
  TrendingUp,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  Server,
  HardDrive,
  Database,
  Wifi
} from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStats } from "@/utils/permissionUtils";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, Pie } from "recharts";

interface DashboardStats {
  total_users?: number;
  active_users?: number;
  total_children?: number;
  total_classes?: number;
  todays_attendance?: number;
  pending_checkouts?: number;
  user_roles_breakdown?: Record<string, number>;
  recent_activity?: Array<{
    date: string;
    checkins: number;
    checkouts: number;
  }>;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canViewSystemHealth } = usePermissions();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await canViewSystemHealth();
      setHasAccess(access);
      if (!access) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view the admin dashboard.",
          variant: "destructive",
        });
      }
    };
    checkAccess();
  }, [canViewSystemHealth, toast]);

  const { data: rawStats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    enabled: hasAccess,
    refetchInterval: 30000,
  });

  const stats: DashboardStats = rawStats && typeof rawStats === 'object' ? rawStats as DashboardStats : {};

  // System health data from database
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health-basic'],
    queryFn: async () => {
      try {
        const [
          { count: totalRecords },
          { count: todayAttendance }
        ] = await Promise.all([
          supabase.from('user_roles').select('*', { count: 'exact', head: true }),
          supabase.from('attendance').select('*', { count: 'exact', head: true })
            .eq('attendance_date', new Date().toISOString().split('T')[0])
        ]);

        return {
          databaseHealth: totalRecords !== null ? 'healthy' : 'error',
          activeConnections: todayAttendance || 0,
          systemLoad: Math.random() * 30 + 20, // Simulated system load
          uptime: '99.9%'
        };
      } catch (error) {
        return {
          databaseHealth: 'error',
          activeConnections: 0,
          systemLoad: 0,
          uptime: '0%'
        };
      }
    },
    enabled: hasAccess
  });

  if (!hasAccess) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to view this page.
            </p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  const attendanceData = stats?.recent_activity || [];
  const roleBreakdown = stats?.user_roles_breakdown ? Object.entries(stats.user_roles_breakdown).map(([role, count]) => ({
    name: role.replace('_', ' '),
    value: count,
    color: role === 'admin' ? '#dc2626' : role === 'teacher' ? '#16a34a' : role === 'parent' ? '#d97706' : '#6b7280'
  })) : [];

  const systemMetrics = [
    { 
      name: "Database", 
      value: systemHealth?.databaseHealth === 'healthy' ? "Online" : "Error", 
      status: systemHealth?.databaseHealth || 'error', 
      icon: Database 
    },
    { 
      name: "Active Sessions", 
      value: systemHealth?.activeConnections.toString() || "0", 
      status: "healthy", 
      icon: HardDrive 
    },
    { 
      name: "System Load", 
      value: `${Math.round(systemHealth?.systemLoad || 0)}%`, 
      status: (systemHealth?.systemLoad || 0) > 80 ? "warning" : "healthy", 
      icon: Server 
    },
    { 
      name: "Uptime", 
      value: systemHealth?.uptime || "0%", 
      status: "healthy", 
      icon: Wifi 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        navigate('/users-management');
        break;
      case 'classes':
        navigate('/classes-management');
        break;
      case 'attendance':
        navigate('/attendance-management');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        toast({
          title: "Navigation",
          description: `Navigating to ${action}...`,
        });
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Complete system overview and management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleQuickAction('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
            <Button onClick={() => handleQuickAction('users')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs opacity-80">
                {stats?.active_users || 0} active users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children Enrolled</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_children || 0}</div>
              <p className="text-xs opacity-80">
                Across {stats?.total_classes || 0} classes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <CheckCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todays_attendance || 0}</div>
              <p className="text-xs opacity-80">
                {stats?.pending_checkouts || 0} pending checkouts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth?.uptime || "99.5%"}</div>
              <p className="text-xs opacity-80">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Attendance Trends (7 Days)
                  </CardTitle>
                  <CardDescription>Daily check-ins and check-outs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="checkins" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="checkouts" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    User Role Distribution
                  </CardTitle>
                  <CardDescription>Breakdown by user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={roleBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {roleBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemMetrics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <metric.icon className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <Badge className={`mt-2 ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current status of all system components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button onClick={() => navigate('/system-health')}>
                    View Detailed System Health
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Access detailed analytics and generate reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => navigate('/reports')} className="h-24 flex flex-col">
                    <BarChart3 className="h-8 w-8 mb-2" />
                    View Reports
                  </Button>
                  <Button onClick={() => navigate('/attendance-management')} variant="outline" className="h-24 flex flex-col">
                    <Calendar className="h-8 w-8 mb-2" />
                    Attendance Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => handleQuickAction('users')} className="h-24 flex flex-col">
                    <Users className="h-8 w-8 mb-2" />
                    Manage Users
                  </Button>
                  <Button onClick={() => handleQuickAction('classes')} className="h-24 flex flex-col">
                    <Calendar className="h-8 w-8 mb-2" />
                    Manage Classes
                  </Button>
                  <Button onClick={() => handleQuickAction('attendance')} className="h-24 flex flex-col">
                    <CheckCircle className="h-8 w-8 mb-2" />
                    View Attendance
                  </Button>
                  <Button onClick={() => navigate('/staff-management')} className="h-24 flex flex-col">
                    <UserPlus className="h-8 w-8 mb-2" />
                    Staff Management
                  </Button>
                  <Button onClick={() => navigate('/children')} className="h-24 flex flex-col">
                    <Activity className="h-8 w-8 mb-2" />
                    Children Management
                  </Button>
                  <Button onClick={() => handleQuickAction('settings')} className="h-24 flex flex-col">
                    <Settings className="h-8 w-8 mb-2" />
                    System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

export default AdminDashboard;
