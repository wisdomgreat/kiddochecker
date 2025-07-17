
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
  BookOpen,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import RoleGuard from "@/components/security/RoleGuard";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch teacher's assigned classes
  const { data: teacherClasses = [] } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          classes (id, name, description, capacity, room)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch attendance for teacher's classes today
  const { data: classAttendance = [] } = useQuery({
    queryKey: ["class-attendance", selectedDate, teacherClasses],
    queryFn: async () => {
      if (teacherClasses.length === 0) return [];
      
      const classIds = teacherClasses.map(tc => tc.class_id).filter(Boolean);
      if (classIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children (first_name, last_name, allergies),
          classes (name)
        `)
        .in('class_id', classIds)
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;
      return data || [];
    },
    enabled: teacherClasses.length > 0,
  });

  const presentCount = classAttendance.filter(record => !record.checked_out_at).length;
  const totalCheckedIn = classAttendance.length;
  const childrenWithAllergies = classAttendance.filter(record => record.children?.allergies).length;

  const quickActions = [
    {
      title: "Take Attendance",
      description: "Record class attendance",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      action: () => navigate('/attendance')
    },
    {
      title: "View My Classes",
      description: "Manage class information",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
      action: () => navigate('/classes')
    },
    {
      title: "Send Message",
      description: "Communicate with parents",
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-600",
      action: () => navigate('/messages')
    },
    {
      title: "Check-In Assistance",
      description: "Help with morning check-ins",
      icon: Users,
      color: "bg-orange-100 text-orange-600",
      action: () => navigate('/check-in-kiosk')
    }
  ];

  return (
    <RoleGuard allowedRoles={['teacher', 'teacher_assistant', 'admin', 'super_admin']}>
      <ModernLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your classes and students</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">My Classes</p>
                    <p className="text-2xl font-bold">{teacherClasses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Present Today</p>
                    <p className="text-2xl font-bold">{presentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Check-ins</p>
                    <p className="text-2xl font-bold">{totalCheckedIn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Allergies</p>
                    <p className="text-2xl font-bold">{childrenWithAllergies}</p>
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

          {/* My Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacherClasses.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No classes assigned</h3>
                  <p className="text-muted-foreground">
                    Contact your administrator to get assigned to classes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacherClasses.map((teacherClass: any) => (
                    <div key={teacherClass.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">{teacherClass.classes?.name || 'Unnamed Class'}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {teacherClass.classes?.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Room: {teacherClass.classes?.room || 'TBD'}</span>
                        <span>Capacity: {teacherClass.classes?.capacity || 'N/A'}</span>
                      </div>
                      <div className="mt-3">
                        <Badge variant="outline">
                          {classAttendance.filter(a => a.class_id === teacherClass.class_id && !a.checked_out_at).length} present today
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Today's Attendance ({format(new Date(selectedDate), 'MMM dd, yyyy')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classAttendance.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No attendance records</h3>
                  <p className="text-muted-foreground">
                    Attendance records for your classes will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {classAttendance.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${record.checked_out_at ? 'bg-blue-500' : 'bg-green-500'}`} />
                        <div>
                          <p className="font-medium">
                            {record.children?.first_name} {record.children?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.classes?.name}
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

export default TeacherDashboard;
