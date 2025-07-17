
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Search,
  Heart,
  Clock,
  HelpCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import RoleGuard from "@/components/security/RoleGuard";

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch today's attendance for assistance
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["today-attendance-volunteer", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name, allergies),
          classes (name)
        `)
        .eq('attendance_date', selectedDate)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch children for search assistance
  const { data: allChildren = [] } = useQuery({
    queryKey: ["all-children-volunteer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name, age')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredChildren = allChildren.filter((child: any) =>
    child.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedInCount = todayAttendance.filter(record => !record.checked_out_at).length;
  const totalAttendance = todayAttendance.length;

  const volunteerTasks = [
    {
      title: "Check-In Assistance",
      description: "Help families with morning check-in",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      action: () => navigate('/check-in-kiosk')
    },
    {
      title: "Find Children",
      description: "Help locate children for pickup",
      icon: Search,
      color: "bg-blue-100 text-blue-600",
      action: () => setSearchTerm("")
    },
    {
      title: "Training Materials",
      description: "Access volunteer guidelines",
      icon: HelpCircle,
      color: "bg-purple-100 text-purple-600",
      action: () => navigate('/help')
    }
  ];

  return (
    <RoleGuard allowedRoles={['volunteer', 'admin', 'super_admin']}>
      <ModernLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-8 w-8 text-red-500" />
              <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Thank you for volunteering! Here's how you can help today.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Children Present</p>
                    <p className="text-2xl font-bold">{checkedInCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Check-ins Today</p>
                    <p className="text-2xl font-bold">{totalAttendance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Volunteer Role</p>
                    <p className="text-lg font-bold">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volunteer Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>How You Can Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {volunteerTasks.map((task, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={task.action}
                  >
                    <div className={`w-12 h-12 rounded-lg ${task.color} flex items-center justify-center mb-3`}>
                      <task.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-1">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Child Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search by child's name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
                
                {searchTerm && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredChildren.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No children found matching "{searchTerm}"
                      </p>
                    ) : (
                      filteredChildren.map((child: any) => {
                        const attendanceRecord = todayAttendance.find(
                          (record: any) => record.child_id === child.id
                        );
                        
                        return (
                          <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{child.first_name} {child.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {child.age ? `${child.age} years old` : 'Age not specified'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {attendanceRecord ? (
                                attendanceRecord.checked_out_at ? (
                                  <Badge variant="secondary">Checked Out</Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-600">Present</Badge>
                                )
                              ) : (
                                <Badge variant="outline">Not Present</Badge>
                              )}
                              {attendanceRecord?.classes?.name && (
                                <Badge variant="outline">{attendanceRecord.classes.name}</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Volunteer Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Check-In Assistance</h4>
                  <p className="text-sm text-blue-700">
                    Help families navigate the check-in process. Direct them to the kiosk and assist with any questions.
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900">Child Safety</h4>
                  <p className="text-sm text-green-700">
                    Always verify identity before releasing children. Only authorized pickup persons can collect children.
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900">Emergency Procedures</h4>
                  <p className="text-sm text-purple-700">
                    In case of emergency, immediately notify staff members. Do not handle emergencies independently.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernLayout>
    </RoleGuard>
  );
};

export default VolunteerDashboard;
