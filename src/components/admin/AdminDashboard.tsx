
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Settings, BarChart3, Calendar, Building, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex items-center gap-2 mt-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Role: {userRole}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">150</div>
            <p className="text-xs text-muted-foreground text-left">+5 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Active Children</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">85</div>
            <p className="text-xs text-muted-foreground text-left">+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Classes</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">12</div>
            <p className="text-xs text-muted-foreground text-left">+2 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Today's Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">67</div>
            <p className="text-xs text-muted-foreground text-left">3 pending checkouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-left mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-left">5 new users registered today</span>
              <span className="text-xs text-muted-foreground ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-left">2 new classes created</span>
              <span className="text-xs text-muted-foreground ml-auto">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-left">45 check-ins completed</span>
              <span className="text-xs text-muted-foreground ml-auto">6 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
