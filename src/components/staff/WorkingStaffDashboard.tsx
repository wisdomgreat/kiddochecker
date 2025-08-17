
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  FileUp,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Upload,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardData';

const WorkingStaffDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  const quickStats = [
    { 
      label: 'Children Present', 
      value: isLoading ? '...' : (stats?.checkedIn?.toString() || '42'), 
      icon: Users, 
      color: 'bg-green-500',
      onClick: () => handleNavigation('/attendance')
    },
    { 
      label: 'Total Check-ins', 
      value: isLoading ? '...' : '156', 
      icon: UserCheck, 
      color: 'bg-blue-500',
      onClick: () => handleNavigation('/attendance')
    },
    { 
      label: 'Documents Pending', 
      value: '3', 
      icon: FileUp, 
      color: 'bg-orange-500',
      onClick: () => handleNavigation('/staff/upload-documents')
    },
    { 
      label: 'Classes Active', 
      value: isLoading ? '...' : (stats?.classes?.toString() || '8'), 
      icon: Calendar, 
      color: 'bg-purple-500',
      onClick: () => handleNavigation('/staff/classes')
    }
  ];

  const staffActions = [
    {
      title: 'Check-In Management',
      description: 'Manage child check-ins and check-outs',
      icon: UserCheck,
      actions: [
        { label: 'Check-In Kiosk', action: () => handleNavigation('/check-in') },
        { label: 'Check-Out System', action: () => handleNavigation('/check-out') },
        { label: 'View Attendance', action: () => handleNavigation('/attendance') }
      ]
    },
    {
      title: 'Document Management',
      description: 'Upload and manage required documents',
      icon: FileUp,
      actions: [
        { label: 'Upload Documents', action: () => handleNavigation('/staff/upload-documents') },
        { label: 'View My Documents', action: () => handleNavigation('/staff/my-documents') },
        { label: 'Pending Verification', action: () => handleNavigation('/staff/pending-docs') }
      ]
    },
    {
      title: 'Class Management',
      description: 'View assigned classes and rosters',
      icon: Calendar,
      actions: [
        { label: 'My Classes', action: () => handleNavigation('/staff/classes') },
        { label: 'Class Rosters', action: () => handleNavigation('/staff/rosters') },
        { label: 'Attendance Reports', action: () => handleNavigation('/staff/reports') }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Manage your daily tasks here.
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

      {/* Staff Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffActions.map((card, index) => (
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

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Background Check</p>
                  <p className="text-sm text-muted-foreground">Verified - Uploaded 2 weeks ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleNavigation('/staff/documents/background-check')}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Training Certificate</p>
                  <p className="text-sm text-muted-foreground">Pending verification</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleNavigation('/staff/documents/training-cert')}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Reference Letters</p>
                  <p className="text-sm text-muted-foreground">Required - Not uploaded</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleNavigation('/staff/upload-documents?type=reference')}
              >
                Upload
              </Button>
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
            <Button onClick={() => handleNavigation('/check-in')}>
              <UserCheck className="h-4 w-4 mr-2" />
              Check-In Kiosk
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/staff/upload-documents')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/staff/classes')}>
              <Calendar className="h-4 w-4 mr-2" />
              My Classes
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/attendance')}>
              <FileText className="h-4 w-4 mr-2" />
              View Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingStaffDashboard;
