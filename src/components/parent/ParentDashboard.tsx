
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
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-bold">Parent Portal</h1>
        <p className="text-muted-foreground">Manage your children and stay connected</p>
        <div className="text-sm text-muted-foreground mt-2">
          Welcome, {user?.email}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="children" className="text-xs sm:text-sm">My Children</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-left">My Children</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-left">3</div>
                <p className="text-xs text-muted-foreground text-left">Registered children</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-left">Today's Attendance</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-left">2</div>
                <p className="text-xs text-muted-foreground text-left">Children present today</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-left">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-left">5</div>
                <p className="text-xs text-muted-foreground text-left">New notifications</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-left">QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-left">3</div>
                <p className="text-xs text-muted-foreground text-left">Active QR codes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-left">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={() => setActiveTab("children")} className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Manage Children</span>
                </Button>
                <Button onClick={() => setActiveTab("attendance")} variant="outline" className="h-20 flex flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">View Attendance</span>
                </Button>
                <Button onClick={() => setActiveTab("messages")} variant="outline" className="h-20 flex flex-col gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-sm">Messages</span>
                </Button>
                <Button onClick={() => setActiveTab("profile")} variant="outline" className="h-20 flex flex-col gap-2">
                  <User className="h-6 w-6" />
                  <span className="text-sm">My Profile</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-left">Emma Johnson</span>
                    <span className="text-sm text-green-600">Present - Room A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-left">Liam Johnson</span>
                    <span className="text-sm text-green-600">Present - Room B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-left">Sophia Johnson</span>
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
