
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MessageSquare,
  QrCode
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import RoleGuard from "@/components/security/RoleGuard";

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch today's attendance
  const { data: todayAttendance = [], isLoading } = useQuery({
    queryKey: ["today-attendance", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name, allergies),
          classes (name)
        `)
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all children for quick stats
  const { data: allChildren = [] } = useQuery({
    queryKey: ["all-children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  const checkedInCount = todayAttendance.filter(record => !record.checked_out_at).length;
  const checkedOutCount = todayAttendance.filter(record => record.checked_out_at).length;
  const childrenWithAllergies = todayAttendance.filter(record => record.children?.allergies).length;

  const quickActions = [
    {
      title: "Check-In Kiosk",
      description: "Quick check-in for arrivals",
      icon: QrCode,
      color: "bg-green-100 text-green-600",
      action: () => navigate('/check-in-kiosk')
    },
    {
      title: "Attendance Management",
      description: "Manage daily attendance",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      action: () => navigate('/attendance')
    },
    {
      title: "View All Children",
      description: "Browse all registered children",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      action: () => navigate('/children')
    },
    {
      title: "Real-time Dashboard",
      description: "Live attendance tracking",
      icon: Clock,
      color: "bg-orange-100 text-orange-600",
      action: () => navigate('/staff-realtime-dashboard')
    }
  ];

  return (
    <RoleGuard requireStaffAccess>
      <ModernLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Staff Dashboard</h1>
            <p className="text-muted-foreground">Manage daily operations and track attendance</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Checked In Today</p>
                    <p className="text-2xl font-bold">{checkedInCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Checked Out</p>
                    <p className="text-2xl font-bold">{checkedOutCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Allergies Present</p>
                    <p className="text-2xl font-bold">{childrenWithAllergies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Registered</p>
                    <p className="text-2xl font-bold">{allChildren.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={action.action}
                  >
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Activity ({format(new Date(selectedDate), 'MMM dd, yyyy')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Loading today's attendance...</div>
              ) : todayAttendance.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No attendance records today</h3>
                  <p className="text-muted-foreground">
                    Attendance records will appear here as children check in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {todayAttendance.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${record.checked_out_at ? 'bg-blue-500' : 'bg-green-500'}`} />
                        <div>
                          <p className="font-medium">
                            {record.children?.first_name} {record.children?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.classes?.name || 'No class assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {record.children?.allergies && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Allergies
                          </Badge>
                        )}
                        <div className="text-right text-sm">
                          <p>In: {record.checked_in_at ? format(new Date(record.checked_in_at), 'HH:mm') : '-'}</p>
                          <p>Out: {record.checked_out_at ? format(new Date(record.checked_out_at), 'HH:mm') : 'Present'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ModernLayout>
    </RoleGuard>
  );
};

export default StaffDashboard;
