import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Calendar, MessageSquare, QrCode, Users, Bell, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ParentDashboard = () => {
  const { user, userRole, isParent } = useAuth();
  const navigate = useNavigate();

  // Fetch parent's children data
  const { data: childrenData, isLoading } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
        
      if (error) {
        console.error('Error fetching children:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: isParent && !!user,
  });

  if (!isParent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the parent dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      title: "My Children",
      description: "View and manage your children's information",
      icon: Baby,
      action: () => navigate("/parent/children"),
      color: "bg-pink-500 hover:bg-pink-600"
    },
    {
      title: "Attendance",
      description: "Check attendance records and history",
      icon: Calendar,
      action: () => navigate("/parent/attendance"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Messages",
      description: "View messages from teachers and staff",
      icon: MessageSquare,
      action: () => navigate("/parent/messages"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "QR Codes",
      description: "Generate QR codes for quick check-in",
      icon: QrCode,
      action: () => navigate("/parent/qr-codes"),
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Parent Dashboard</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Baby className="h-4 w-4 text-pink-600 flex-shrink-0" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {user?.email}. Role: <span className="capitalize">{userRole?.replace('_', ' ')}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">My Children</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">
              {isLoading ? "..." : childrenData?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground text-left">
              {isLoading ? "Loading..." : "Registered children"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Today's Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left text-green-600">Active</div>
            <p className="text-xs text-muted-foreground text-left">All children checked in</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">3</div>
            <p className="text-xs text-muted-foreground text-left">Unread messages</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">95%</div>
            <p className="text-xs text-muted-foreground text-left">Attendance rate</p>
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
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-left flex-1">Emma checked in to Room 101</span>
              <span className="text-xs text-muted-foreground">8:30 AM</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-left flex-1">New message from Teacher Sarah</span>
              <span className="text-xs text-muted-foreground">Yesterday</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-left flex-1">QR code generated for quick check-in</span>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;


