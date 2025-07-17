
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
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  MessageSquare,
  Database,
  Server,
  Wifi,
  HardDrive
} from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStats } from "@/utils/permissionUtils";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, Pie } from "recharts";

// Define proper interface for dashboard stats
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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform the data to ensure proper typing
  const stats: DashboardStats = rawStats && typeof rawStats === 'object' ? rawStats as DashboardStats : {};

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
    { name: "CPU Usage", value: "23%", status: "good", icon: Server },
    { name: "Memory", value: "67%", status: "warning", icon: HardDrive },
    { name: "Storage", value: "45%", status: "good", icon: Database },
    { name: "Network", value: "12ms", status: "good", icon: Wifi },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Quick Actions
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
              <div className="text-2xl font-bold">98.5%</div>
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
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
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

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "New user registered", user: "John Smith", time: "2 minutes ago", type: "user" },
                    { action: "Child checked in", user: "Emma Wilson", time: "5 minutes ago", type: "attendance" },
                    { action: "Role updated", user: "Admin", time: "10 minutes ago", type: "security" },
                    { action: "New class created", user: "Sarah Johnson", time: "15 minutes ago", type: "class" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'attendance' ? 'bg-green-100 text-green-600' :
                          activity.type === 'security' ? 'bg-red-100 text-red-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {activity.type === 'user' && <Users className="h-4 w-4" />}
                          {activity.type === 'attendance' && <CheckCircle className="h-4 w-4" />}
                          {activity.type === 'security' && <Shield className="h-4 w-4" />}
                          {activity.type === 'class' && <Calendar className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-500">by {activity.user}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current status of all system components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { service: "Authentication Service", status: "operational", uptime: "99.9%" },
                    { service: "Database", status: "operational", uptime: "99.8%" },
                    { service: "File Storage", status: "operational", uptime: "99.7%" },
                    { service: "Email Service", status: "degraded", uptime: "97.2%" },
                    { service: "Backup Service", status: "operational", uptime: "99.5%" },
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === 'operational' ? 'bg-green-500' :
                          service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{service.service}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Uptime: {service.uptime}</span>
                        <Badge variant={service.status === 'operational' ? 'default' : 'destructive'}>
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Monthly user registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Jan', users: 65 },
                      { month: 'Feb', users: 78 },
                      { month: 'Mar', users: 92 },
                      { month: 'Apr', users: 105 },
                      { month: 'May', users: 134 },
                      { month: 'Jun', users: 156 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">847</div>
                    <div className="text-sm text-blue-500">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">23.4min</div>
                    <div className="text-sm text-green-500">Avg Session Time</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">94.2%</div>
                    <div className="text-sm text-purple-500">User Satisfaction</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Audit Logs
                </CardTitle>
                <CardDescription>System security and user activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { timestamp: "2024-01-15 10:30:42", user: "admin@example.com", action: "User role updated", resource: "users", severity: "medium" },
                    { timestamp: "2024-01-15 10:25:15", user: "system", action: "Backup completed", resource: "system", severity: "info" },
                    { timestamp: "2024-01-15 10:20:03", user: "john@example.com", action: "Login attempt", resource: "auth", severity: "info" },
                    { timestamp: "2024-01-15 10:15:28", user: "admin@example.com", action: "Permission granted", resource: "roles", severity: "high" },
                    { timestamp: "2024-01-15 10:10:45", user: "system", action: "Database migration", resource: "database", severity: "high" },
                  ].map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          log.severity === 'high' ? 'destructive' :
                          log.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {log.severity}
                        </Badge>
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-gray-500">{log.user} • {log.resource}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{log.timestamp}</span>
                    </div>
                  ))}
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
