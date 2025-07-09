
import { Card, CardContent } from "@/components/ui/card";
import { Users, Monitor, BookOpen, Shield, Settings, BarChart3 } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";
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
      title: "Staff Management",
      description: "Manage teachers, assistants, and administrative staff",
      icon: Users,
      onClick: navigateToManagement.staff,
      count: staffMembers.length,
      status: 'active' as const,
    },
    {
      title: "User Management", 
      description: "Manage user accounts and role assignments",
      icon: Shield,
      onClick: navigateToManagement.users,
      count: usersCount,
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
    <SimpleLayout>
      <div className="space-y-6">
        <ManagementHeader 
          title="Management Dashboard"
          description="Comprehensive management tools for your organization"
        />

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

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{staffMembers.length}</div>
                <div className="text-sm text-gray-600">Staff Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{usersCount}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{devices.length}</div>
                <div className="text-sm text-gray-600">Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{classes.length}</div>
                <div className="text-sm text-gray-600">Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleLayout>
  );
};

export default ManagementDashboard;
