
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Calendar, MessageSquare, QrCode, Plus } from "lucide-react";
import ParentChildManagement from "./ParentChildManagement";
import ParentProfile from "./ParentProfile";
import ParentMessages from "./ParentMessages";
import AttendanceTracking from "./AttendanceTracking";
import { useAuth } from "@/context/AuthContext";

const ParentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Portal</h1>
          <p className="text-muted-foreground">Manage your children and stay connected</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Welcome, {user?.email}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="children">My Children</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Children</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Registered children</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Children present today</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">New notifications</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Active QR codes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button onClick={() => setActiveTab("children")} className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Manage Children
                </Button>
                <Button onClick={() => setActiveTab("attendance")} variant="outline" className="h-20 flex flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  View Attendance
                </Button>
                <Button onClick={() => setActiveTab("messages")} variant="outline" className="h-20 flex flex-col gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Messages
                </Button>
                <Button onClick={() => setActiveTab("profile")} variant="outline" className="h-20 flex flex-col gap-2">
                  <User className="h-6 w-6" />
                  My Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Emma Johnson</span>
                    <span className="text-sm text-green-600">Present - Room A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Liam Johnson</span>
                    <span className="text-sm text-green-600">Present - Room B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sophia Johnson</span>
                    <span className="text-sm text-gray-500">Not checked in</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="children">
          <ParentChildManagement />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTracking />
        </TabsContent>

        <TabsContent value="messages">
          <ParentMessages />
        </TabsContent>

        <TabsContent value="profile">
          <ParentProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParentDashboard;
