
import { Card, CardContent } from "@/components/ui/card";
import { Users, Monitor, BookOpen, Shield, Settings, BarChart3 } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import ManagementCard from "@/components/management/ManagementCard";
import ManagementHeader from "@/components/management/ManagementHeader";
import { useManagementNavigation } from "@/hooks/useManagementNavigation";
import { useStaffManagement } from "@/hooks/useStaffManagement";
import { useDevices } from "@/hooks/useDevices";
import { useClasses } from "@/hooks/useClasses";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ManagementDashboard = () => {
  const { navigateToManagement } = useManagementNavigation();
  const { staffMembers } = useStaffManagement();
  const { devices } = useDevices();
  const { classes } = useClasses();

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const managementItems = [
    {
      title: "User Management",
      description: "Manage all users and their roles",
      icon: Users,
      onClick: navigateToManagement.users,
      count: usersCount,
      status: 'active' as const,
    },
    {
      title: "Staff Management", 
      description: "Manage teachers, assistants, and administrative staff",
      icon: Users,
      onClick: navigateToManagement.staff,
      count: staffMembers.length,
      status: 'active' as const,
    },
    {
      title: "Device Management",
      description: "Manage check-in kiosks and check-out stations",
      icon: Monitor,
      onClick: navigateToManagement.devices,
      count: devices.length,
      status: devices.length > 0 ? 'active' as const : 'warning' as const,
    },
    {
      title: "Classes Management",
      description: "Manage classes and teacher assignments",
      icon: BookOpen,
      onClick: navigateToManagement.classes,
      count: classes.length,
      status: 'active' as const,
    },
    {
      title: "Reports & Analytics",
      description: "View attendance reports and system analytics",
      icon: BarChart3,
      onClick: navigateToManagement.reports,
      status: 'active' as const,
    },
    {
      title: "System Settings",
      description: "Configure organization settings and preferences",
      icon: Settings,
      onClick: navigateToManagement.settings,
      status: 'active' as const,
    },
  ];

  return (
    <ModernLayout>
      <div className="space-y-6">
        <ManagementHeader 
          title="Admin Dashboard"
          description="Welcome back, manage your organization from here."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{usersCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {usersCount} active users
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground">
                    Super admin access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Staff</p>
                  <p className="text-2xl font-bold">{staffMembers.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Active staff members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-amber-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Parents</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">
                    Registered parents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementItems.map((item) => (
              <ManagementCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={item.onClick}
                count={item.count}
                status={item.status}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System started successfully</span>
                <span className="text-xs text-gray-400 ml-auto">Just now</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Admin dashboard loaded</span>
                <span className="text-xs text-gray-400 ml-auto">1 minute ago</span>
              </div>
              <div className="text-center py-8 text-gray-500">
                <p>More activity will appear here as users interact with the system</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default ManagementDashboard;
