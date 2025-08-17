
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/CleanAuthContext";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Clock, 
  Heart,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award
} from "lucide-react";
import RoleGuard from "@/components/security/RoleGuard";

const VolunteerDashboard = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has volunteer role (is_volunteer flag or volunteer-related roles)
  const isVolunteer = userRole === 'staff' || userRole === 'teacher_assistant';

  if (!isVolunteer) {
    return <Navigate to="/access-denied" replace />;
  }

  const volunteerStats = {
    hoursThisMonth: 24,
    childrenHelped: 15,
    eventsAttended: 6,
    upcomingShifts: 3
  };

  const upcomingEvents = [
    {
      id: 1,
      title: "Sunday Service Childcare",
      date: "2024-03-10",
      time: "9:00 AM - 12:00 PM",
      location: "Children's Ministry",
      status: "confirmed"
    },
    {
      id: 2,
      title: "Special Event Setup",
      date: "2024-03-15",
      time: "2:00 PM - 5:00 PM",
      location: "Main Hall",
      status: "pending"
    }
  ];

  return (
    <RoleGuard requireStaffAccess>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your volunteer overview.</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Volunteer
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{volunteerStats.hoursThisMonth}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children Helped</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{volunteerStats.childrenHelped}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{volunteerStats.eventsAttended}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{volunteerStats.upcomingShifts}</div>
              <p className="text-xs text-muted-foreground">Next 2 weeks</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Volunteer Shifts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.date} • {event.time}</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                  <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                    {event.status === 'confirmed' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {event.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Log Volunteer Hours
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                View Event Calendar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Check-in Children
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Heart className="mr-2 h-4 w-4" />
                View Volunteer Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
};

export default VolunteerDashboard;
