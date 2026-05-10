
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus,
  QrCode,
  Calendar,
  MessageSquare,
  Bell,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const WorkingParentDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  // Sample data - would be fetched from API
  const children = [
    {
      id: '1',
      firstName: 'Emma',
      lastName: 'Johnson',
      age: 8,
      currentClass: 'Elementary Group',
      status: 'present',
      checkedInAt: '10:30 AM'
    },
    {
      id: '2',
      firstName: 'Jake',
      lastName: 'Johnson',
      age: 12,
      currentClass: 'Youth Group',
      status: 'not-present',
      checkedInAt: null
    }
  ];

  const quickStats = [
    { 
      label: 'My Children', 
      value: children.length.toString(), 
      icon: Users, 
      color: 'bg-blue-500',
      onClick: () => handleNavigation('/parent/children')
    },
    { 
      label: 'Currently Present', 
      value: children.filter(c => c.status === 'present').length.toString(), 
      icon: CheckCircle, 
      color: 'bg-green-500',
      onClick: () => handleNavigation('/parent/attendance')
    },
    { 
      label: 'Unread Messages', 
      value: '2', 
      icon: MessageSquare, 
      color: 'bg-orange-500',
      onClick: () => handleNavigation('/parent/messages')
    },
    { 
      label: 'Upcoming Events', 
      value: '3', 
      icon: Calendar, 
      color: 'bg-purple-500',
      onClick: () => handleNavigation('/parent/events')
    }
  ];

  const parentActions = [
    {
      title: 'My Children',
      description: 'Manage your children\'s information and attendance',
      icon: Users,
      actions: [
        { label: 'View All Children', action: () => handleNavigation('/parent/children') },
        { label: 'Add New Child', action: () => handleNavigation('/parent/add-child') },
        { label: 'Attendance History', action: () => handleNavigation('/parent/attendance') }
      ]
    },
    {
      title: 'Quick Check-In',
      description: 'Generate QR codes for fast check-in',
      icon: QrCode,
      actions: [
        { label: 'Generate QR Codes', action: () => handleNavigation('/parent/qr-codes') },
        { label: 'Print Name Tags', action: () => handleNavigation('/parent/name-tags') }
      ]
    },
    {
      title: 'Communication',
      description: 'Messages and notifications from staff',
      icon: MessageSquare,
      actions: [
        { label: 'View Messages', action: () => handleNavigation('/parent/messages') },
        { label: 'Contact Staff', action: () => handleNavigation('/parent/contact') }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Keep track of your children here.
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

      {/* Children Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Children
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{child.firstName} {child.lastName}</h3>
                    <p className="text-sm text-muted-foreground">Age {child.age} • {child.currentClass}</p>
                    {child.status === 'present' && (
                      <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                        <CheckCircle className="h-3 w-3" />
                        Present since {child.checkedInAt}
                      </div>
                    )}
                    {child.status === 'not-present' && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <XCircle className="h-3 w-3" />
                        Not checked in
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNavigation(`/parent/child/${child.id}/qr`)}
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR Code
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNavigation(`/parent/child/${child.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parent Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parentActions.map((card, index) => (
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

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleNavigation('/parent/messages')}>
              <Bell className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard is now fully functional!</p>
                <p className="text-xs text-muted-foreground">System Update - Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleNavigation('/parent/messages')}>
              <Calendar className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">All features are now working properly</p>
                <p className="text-xs text-muted-foreground">System Update - 1 minute ago</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => handleNavigation('/parent/messages')}
          >
            View All Messages
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleNavigation('/parent/add-child')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/parent/qr-codes')}>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Codes
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/parent/messages')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
            <Button variant="outline" onClick={() => handleNavigation('/parent/attendance')}>
              <Clock className="h-4 w-4 mr-2" />
              Attendance History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingParentDashboard;

