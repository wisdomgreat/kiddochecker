
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3, 
  Calendar,
  MessageSquare,
  Shield,
  Monitor,
  GraduationCap,
  Baby
} from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import UserManagement from "@/components/admin/UserManagement";
import ClassManagement from "@/components/admin/ClassManagement";
import EnhancedReporting from "@/components/admin/EnhancedReporting";
import DeviceManagement from "@/components/admin/DeviceManagement";
import StaffInvitationManager from "@/components/staff/StaffInvitationManager";
import EnhancedCheckInSystem from "@/components/checkin/EnhancedCheckInSystem";

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "staff", label: "Staff & Invitations", icon: UserPlus },
    { id: "children", label: "Children Management", icon: Baby },
    { id: "classes", label: "Class Management", icon: GraduationCap },
    { id: "checkin", label: "Check-in System", icon: Monitor },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { id: "devices", label: "Device Management", icon: Monitor },
    { id: "settings", label: "Organization Settings", icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview />;
      case "users":
        return <UserManagement />;
      case "staff":
        return <StaffInvitationManager />;
      case "children":
        return <ChildrenManagement />;
      case "classes":
        return <ClassManagement />;
      case "checkin":
        return <EnhancedCheckInSystem />;
      case "reports":
        return <EnhancedReporting />;
      case "devices":
        return <DeviceManagement />;
      case "settings":
        return <OrganizationSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administration Dashboard</h1>
          <p className="text-gray-600">Manage your organization, users, and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 h-auto">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3 text-xs"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            {renderTabContent()}
          </div>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

// Dashboard Overview Component
const DashboardOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Registered users</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Children</CardTitle>
          <Baby className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Enrolled children</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Classes</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Available classes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Check-ins today</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Children Management Component
const ChildrenManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Children Management</h2>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Child
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Registered Children</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Baby className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No children registered yet</p>
            <p className="text-sm">Children will appear here when parents register them</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Organization Settings Component
const OrganizationSettings = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Organization Settings</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Settings className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Settings panel coming soon</p>
            <p className="text-sm">Configure your organization preferences here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementDashboard;
