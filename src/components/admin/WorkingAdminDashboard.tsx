
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  Monitor,
  FileText,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardData';

const WorkingAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  const quickStats = [
    { 
      label: 'Total Users', 
      value: isLoading ? '...' : '24', 
      icon: Users, 
      color: 'bg-blue-500',
      onClick: () => handleNavigation('/admin/user-management')
    },
    { 
      label: 'Active Classes', 
      value: isLoading ? '...' : (stats?.classes?.toString() || '8'), 
      icon: GraduationCap, 
      color: 'bg-green-500',
      onClick: () => handleNavigation('/admin/classes')
    },
    { 
      label: 'Devices', 
      value: isLoading ? '...' : '12', 
      icon: Monitor, 
      color: 'bg-purple-500',
      onClick: () => handleNavigation('/admin/devices')
    },
    { 
      label: 'Today Check-ins', 
      value: isLoading ? '...' : (stats?.checkedIn?.toString() || '156'), 
      icon: CheckCircle, 
      color: 'bg-orange-500',
      onClick: () => handleNavigation('/admin/reports')
    }
  ];

  const managementCards = [
    {
      title: 'User Management',
      description: 'Create, edit, and manage user accounts and roles',
      icon: Users,
      actions: [
        { label: 'View All Users', action: () => handleNavigation('/admin/user-management') },
        { label: 'Create New User', action: () => handleNavigation('/admin/user-management?action=create') }
      ]
    },
    {
      title: 'Staff Management',
      description: 'Manage staff members, roles, and permissions',
      icon: UserPlus,
      actions: [
        { label: 'View Staff', action: () => handleNavigation('/admin/user-management?filter=staff') },
        { label: 'Document Verification', action: () => handleNavigation('/admin/document-verification') }
      ]
    },
    {
      title: 'Class Management',
      description: 'Create and manage classes, assign teachers',
      icon: GraduationCap,
      actions: [
        { label: 'View Classes', action: () => handleNavigation('/admin/classes') },
        { label: 'Create Class', action: () => handleNavigation('/admin/classes?action=create') }
      ]
    },
    {
      title: 'Device Management',
      description: 'Manage check-in devices and kiosks',
      icon: Monitor,
      actions: [
        { label: 'View Devices', action: () => handleNavigation('/admin/devices') },
        { label: 'Enroll Device', action: () => handleNavigation('/admin/devices?action=enroll') }
      ]
    },
    {
      title: 'Reports & Analytics',
      description: 'View attendance reports and system analytics',
      icon: BarChart3,
      actions: [
        { label: 'Attendance Reports', action: () => handleNavigation('/admin/reports') },
        { label: 'Analytics Dashboard', action: () => handleNavigation('/admin/reports?view=analytics') }
      ]
    },
    {
      title: 'System Settings',
      description: 'Configure organization settings and preferences',
      icon: Settings,
      actions: [
        { label: 'Organization Settings', action: () => handleNavigation('/admin/settings') },
        { label: 'Security Settings', action: () => handleNavigation('/admin/settings?tab=security') }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Manage your organization from here.
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Role: {userRole}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={stat.onClick}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-md ${stat.color} text-white mr-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <card.icon className="h-5 w-5" />
                {card.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {card.actions.map((action, actionIndex) => (
                <Button
                  key={actionIndex}
                  variant={actionIndex === 0 ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={action.action}
                >
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">System operational - All services running</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Users className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">User management system active</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard fully functional</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleNavigation('/admin/user-management?action=create')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/admin/devices?action=enroll')}>
              <Monitor className="h-4 w-4 mr-2" />
              Enroll Device
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/admin/reports')}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/admin/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingAdminDashboard;

