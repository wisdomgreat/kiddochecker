
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, Calendar, MessageSquare, Settings } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";

const VolunteerDashboard = () => {
  const { user, userRole, loading, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isStaff)) {
      navigate('/landing');
    }
  }, [user, userRole, loading, isStaff, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isStaff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this area.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      title: "View Children",
      description: "Check and manage children information",
      icon: Users,
      action: () => navigate("/admin/children")
    },
    {
      title: "Attendance",
      description: "Manage check-ins and check-outs",
      icon: Calendar,
      action: () => navigate("/admin/attendance")
    },
    {
      title: "Messages",
      description: "View and send messages",
      icon: MessageSquare,
      action: () => navigate("/admin/messages")
    },
    {
      title: "Settings",
      description: "Update your preferences",
      icon: Settings,
      action: () => navigate("/admin/settings")
    }
  ];

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what you can do today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {action.title}
                </CardTitle>
                <action.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  {action.description}
                </p>
                <Button 
                  onClick={action.action}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Access
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">--</div>
                <div className="text-sm text-muted-foreground">Children Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">--</div>
                <div className="text-sm text-muted-foreground">Pending Checkouts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">--</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default VolunteerDashboard;


