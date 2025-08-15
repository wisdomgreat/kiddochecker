
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Calendar, MessageSquare, QrCode, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CleanParentDashboard = () => {
  const { user, isParent } = useAuth();
  const navigate = useNavigate();

  // Fetch parent's children
  const { data: children = [], isLoading } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching children:', error);
        return [];
      }
    },
    enabled: !!user && isParent,
  });

  if (!isParent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-left">Parent Portal</h2>
            <p className="text-muted-foreground text-left">Access denied. Please contact an administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      title: "My Children",
      description: "Manage your children's information",
      icon: Baby,
      action: () => navigate("/parent/children"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Attendance",
      description: "View attendance records",
      icon: Calendar,
      action: () => navigate("/parent/attendance"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Messages",
      description: "View messages from staff",
      icon: MessageSquare,
      action: () => navigate("/parent/messages"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "QR Codes",
      description: "Generate check-in QR codes",
      icon: QrCode,
      action: () => navigate("/parent/children"),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-foreground">Parent Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">My Children</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">
              {isLoading ? "..." : children.length}
            </div>
            <p className="text-xs text-muted-foreground text-left">Registered children</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Present Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">0</div>
            <p className="text-xs text-muted-foreground text-left">Children checked in</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-left">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-left">0</div>
            <p className="text-xs text-muted-foreground text-left">Unread messages</p>
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

      {/* Children Overview */}
      {children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-left flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Children Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {child.first_name?.[0]}{child.last_name?.[0]}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{child.first_name} {child.last_name}</p>
                      <p className="text-sm text-muted-foreground">Age: {child.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Not Present</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for No Children */}
      {children.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-left mb-2">No Children Registered</h3>
            <p className="text-muted-foreground text-left mb-4">Get started by adding your first child.</p>
            <Button onClick={() => navigate("/parent/children")}>
              Add Child
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CleanParentDashboard;
