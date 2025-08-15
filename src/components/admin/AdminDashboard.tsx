
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Settings, BarChart3, Calendar, Building, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { user, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const { data: usersData } = await supabase.rpc('get_users_with_roles');
      const { data: childrenData } = await supabase.from('children').select('id');
      const { data: classesData } = await supabase.from('classes').select('id');
      
      return {
        totalUsers: usersData?.length || 0,
        activeUsers: usersData?.filter((u: any) => u.is_active)?.length || 0,
        totalChildren: childrenData?.length || 0,
        totalClasses: classesData?.length || 0,
      };
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
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
    <div className="space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {user?.email}. Role: <span className="capitalize">{userRole?.replace('_', ' ')}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
            <CardTitle className="text-sm font-medium text-left">Today's Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left text-green-600">Active</div>
            <p className="text-xs text-muted-foreground text-left">System operational</p>
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
              <CardContent className="p-4 sm:p-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${action.color} text-white mb-3 sm:mb-4`}>
                  <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-semibold text-left mb-2 text-sm sm:text-base">{action.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-left line-clamp-2">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-left flex-1">System is operational</span>
              <span className="text-xs text-muted-foreground">Now</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-left flex-1">Database connection stable</span>
              <span className="text-xs text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-left flex-1">Authentication services active</span>
              <span className="text-xs text-muted-foreground">5 min ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
