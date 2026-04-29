
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Users, Calendar, ClipboardList, MessageSquare, Plus, UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StaffDashboard = () => {
  const { user, userRole, isTeacher, isTeacherAssistant, isStaff } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Check-in Children",
      description: "Check children into classes",
      icon: UserCheck,
      action: () => navigate("/checkin"),
      roles: ['staff', 'teacher', 'teacher_assistant', 'admin']
    },
    {
      title: "Check-out Children",
      description: "Check children out of classes",
      icon: UserX,
      action: () => navigate("/checkout"),
      roles: ['staff', 'teacher', 'teacher_assistant', 'admin']
    },
    {
      title: "View Classes",
      description: "Manage class rosters",
      icon: Users,
      action: () => navigate("/classes"),
      roles: ['staff', 'teacher', 'teacher_assistant', 'admin']
    },
    {
      title: "Add Child Notes",
      description: "Add notes for children",
      icon: ClipboardList,
      action: () => navigate("/notes"),
      roles: ['teacher', 'teacher_assistant', 'staff', 'admin']
    },
    {
      title: "View Reports",
      description: "Access attendance reports",
      icon: Calendar,
      action: () => navigate("/reports"),
      roles: ['staff', 'admin']
    },
    {
      title: "Messages",
      description: "Communicate with parents",
      icon: MessageSquare,
      action: () => navigate("/messages"),
      roles: ['staff', 'teacher', 'teacher_assistant', 'admin']
    }
  ];

  const availableActions = quickActions.filter(action => 
    action.roles.includes(userRole || 'parent')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.user_metadata?.first_name || user?.email}
          </p>
          <p className="text-sm text-muted-foreground capitalize">Role: {userRole}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Children checked in today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Classes with children present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Checkouts</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Children ready for pickup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={action.action}
              >
                <div className="flex items-center space-x-2">
                  <action.icon className="h-5 w-5" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  {action.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific content */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate("/my-classes")}>
                <Users className="mr-2 h-4 w-4" />
                My Classes
              </Button>
              <Button variant="outline" onClick={() => navigate("/child-notes")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Child Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate("/attendance-reports")}>
                <Calendar className="mr-2 h-4 w-4" />
                Attendance Reports
              </Button>
              <Button variant="outline" onClick={() => navigate("/emergency-contacts")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Emergency Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffDashboard;

