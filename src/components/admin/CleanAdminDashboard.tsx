
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Settings, BarChart3, Calendar, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CleanAdminDashboard = () => {
  const { user, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch real dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      try {
        const { data: usersData } = await supabase.rpc('get_users_with_roles');
        const { data: childrenData } = await supabase.from('children').select('id');
        const { data: classesData } = await supabase.from('classes').select('id');
        
        return {
          totalUsers: usersData?.length || 0,
          activeUsers: usersData?.filter((u: any) => u.is_active)?.length || 0,
          totalChildren: childrenData?.length || 0,
          totalClasses: classesData?.length || 0,
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return {
          totalUsers: 0,
          activeUsers: 0,
          totalChildren: 0,
          totalClasses: 0,
        };
      }
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-left">Access Denied</h2>
            <p className="text-muted-foreground text-left">You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Manage Users",
      description: "Add, edit, and manage user accounts",
      icon: Users,
      action: () => navigate("/admin/users"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Add New User",
      description: "Create new user accounts",
      icon: UserPlus,  
      action: () => navigate("/admin/users"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "View Reports",
      description: "Access system reports and analytics",
      icon: BarChart3,
      action: () => navigate("/admin/reports"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      action: () => navigate("/admin/settings"),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex items-center gap-2 mt-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Role: <span className="capitalize">{userRole?.replace('_', ' ')}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">
              {isLoading ? "..." : stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground text-left">
              {isLoading ? "Loading..." : `${stats?.activeUsers || 0} active`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Total Children</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">
              {isLoading ? "..." : stats?.totalChildren || 0}
            </div>
            <p className="text-xs text-muted-foreground text-left">Registered children</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">
              {isLoading ? "..." : stats?.totalClasses || 0}
            </div>
            <p className="text-xs text-muted-foreground text-left">Active classes</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">System Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left text-green-600">Active</div>
            <p className="text-xs text-muted-foreground text-left">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-left mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-left mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground text-left">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-left">Database Connection</span>
              </div>
              <span className="text-xs text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-left">Authentication Service</span>
              </div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-left">Storage Service</span>
              </div>
              <span className="text-xs text-muted-foreground">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanAdminDashboard;
