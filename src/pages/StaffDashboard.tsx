
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MessageSystem from '@/components/communication/MessageSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  MessageSquare, 
  Users, 
  Settings,
  Monitor,
  QrCode,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Manage attendance, communicate with parents, and monitor children's activities.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Live View</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Children</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 hidden lg:flex">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    Live Attendance View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Monitor real-time check-ins and check-outs with live updates.
                  </p>
                  <Button 
                    onClick={() => navigate('/staff-realtime')}
                    className="w-full"
                  >
                    Open Live Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-green-600" />
                    Check-Out Station
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Access the check-out station for secure child pickup verification.
                  </p>
                  <Button 
                    onClick={() => navigate('/check-out-station')}
                    className="w-full"
                    variant="outline"
                  >
                    Open Check-Out Station
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Communication Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Send messages to parents and broadcast emergency alerts.
                  </p>
                  <Button 
                    onClick={() => {
                      const tabsElement = document.querySelector('[data-state="active"][value="messages"]');
                      if (tabsElement) {
                        (tabsElement as HTMLElement).click();
                      }
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    View Messages
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center space-y-4">
                <Monitor className="h-16 w-16 text-blue-600 mx-auto" />
                <h2 className="text-2xl font-semibold">Real-time Attendance Dashboard</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Click below to open the dedicated real-time dashboard in a new tab for the best experience.
                </p>
                <Button 
                  onClick={() => window.open('/staff-realtime', '_blank')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Monitor className="h-5 w-5 mr-2" />
                  Open Real-time Dashboard
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <MessageSystem isStaffView={true} />
          </TabsContent>

          <TabsContent value="children">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Children Management</h2>
              <p className="text-gray-600">Children management features coming in Phase 4...</p>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Attendance Reports</h2>
              <p className="text-gray-600">Detailed reporting features coming in Phase 4...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffDashboard;
