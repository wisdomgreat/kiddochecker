
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  Users,
  UserCheck,
  Clock,
  MessageSquare,
  Calendar,
  BookOpen,
  Activity,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch teacher's assigned classes
  const { data: myClasses = [] } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          class_id,
          classes (
            id,
            name,
            description,
            capacity,
            room
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(t => t.classes).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch today's attendance for teacher's classes
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["teacher-attendance", user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id || myClasses.length === 0) return [];
      
      const classIds = myClasses.map((c: any) => c.id);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          children (first_name, last_name, allergies),
          classes (name)
        `)
        .in('class_id', classIds)
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && myClasses.length > 0,
  });

  // Calculate stats
  const totalStudents = todayAttendance.length;
  const presentStudents = todayAttendance.filter(a => a.checked_in_at && !a.checked_out_at).length;
  const studentsWithAllergies = todayAttendance.filter(a => a.children?.allergies).length;

  // Fetch upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .order('start_date')
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your classes and track student progress.</p>
          </div>
          <Button onClick={() => navigate('/classes')}>
            <GraduationCap className="mr-2 h-4 w-4" />
            View All Classes
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">My Classes</p>
                  <p className="text-2xl font-bold">{myClasses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Students Today</p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Present Now</p>
                  <p className="text-2xl font-bold">{presentStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Students with Allergies</p>
                  <p className="text-2xl font-bold">{studentsWithAllergies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myClasses.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No classes assigned</h3>
                  <p className="text-muted-foreground">
                    Contact an administrator to get assigned to classes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myClasses.map((classInfo: any) => {
                    const classAttendance = todayAttendance.filter(a => a.classes?.name === classInfo.name);
                    const presentCount = classAttendance.filter(a => a.checked_in_at && !a.checked_out_at).length;
                    
                    return (
                      <div key={classInfo.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{classInfo.name}</h3>
                          <Badge variant="secondary">
                            {presentCount}/{classAttendance.length} present
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {classInfo.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {classInfo.room && (
                            <span>Room: {classInfo.room}</span>
                          )}
                          {classInfo.capacity && (
                            <span>Capacity: {classInfo.capacity}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No attendance today</h3>
                  <p className="text-muted-foreground">
                    Student attendance will appear here once check-ins begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAttendance.slice(0, 6).map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          record.checked_out_at ? 'bg-gray-100' : 'bg-green-100'
                        }`}>
                          <UserCheck className={`h-4 w-4 ${
                            record.checked_out_at ? 'text-gray-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.children?.first_name} {record.children?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.classes?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.children?.allergies && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Allergies
                          </Badge>
                        )}
                        <Badge variant={record.checked_out_at ? "secondary" : "default"}>
                          {record.checked_out_at ? "Checked Out" : "Present"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No upcoming events</h3>
                  <p className="text-muted-foreground">
                    School events and activities will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event: any) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start_date), 'MMM dd, yyyy')} at {format(new Date(event.start_date), 'HH:mm')}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" onClick={() => navigate('/attendance')} className="justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Take Attendance
                </Button>
                <Button variant="outline" onClick={() => navigate('/children')} className="justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View All Students
                </Button>
                <Button variant="outline" onClick={() => navigate('/check-in-kiosk')} className="justify-start">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Check-in Station
                </Button>
                <Button variant="outline" onClick={() => navigate('/messages')} className="justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
  );
};

export default TeacherDashboard;
