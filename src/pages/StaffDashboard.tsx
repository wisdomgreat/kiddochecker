
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  Monitor,
  MessageSquare,
  QrCode,
  Bell,
  Clock,
  Eye,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { children } = useChildren();
  const { classes } = useClasses();
  const { attendance } = useAttendance();

  const todayAttendance = attendance.filter(record => 
    record.attendance_date === new Date().toISOString().split('T')[0]
  );
  const checkedInToday = todayAttendance.filter(record => !record.checked_out_at).length;

  const quickActions = [
    {
      title: 'Live Attendance View',
      description: 'Monitor real-time check-ins and check-outs with live updates',
      icon: Monitor,
      action: () => navigate('/staff-realtime'),
      color: 'bg-blue-50 text-blue-600',
      featured: true
    },
    {
      title: 'Check-Out Station',
      description: 'Access the check-out station for secure child pickup verification',
      icon: QrCode,
      action: () => navigate('/check-out-station'),
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Communication Center',
      description: 'Send messages to parents and broadcast emergency alerts',
      icon: MessageSquare,
      action: () => {},
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const recentMessages = [
    { parent: 'Sarah Johnson', message: 'Emma had a great day in class!', time: '2 hours ago', type: 'sent' },
    { parent: 'Michael Davis', message: 'Thanks for the class summary', time: '3 hours ago', type: 'received' },
    { parent: 'Jennifer Brown', message: 'Noah needs to bring his Bible next Sunday', time: '1 day ago', type: 'sent' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage attendance, communicate with parents, and monitor children's activities.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/staff-realtime')}>
              <Monitor className="h-4 w-4 mr-2" />
              Live Dashboard
            </Button>
            <Button onClick={() => navigate('/check-in-out')}>
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Currently Present"
            value={checkedInToday}
            subtitle="Children checked in"
            icon={UserCheck}
            iconColor="text-green-600"
            actionLabel="View Live"
            onAction={() => navigate('/staff-realtime')}
          />
          <StatCard
            title="Total Children"
            value={children.length}
            subtitle="Registered children"
            icon={Users}
            iconColor="text-blue-600"
            actionLabel="Manage"
            onAction={() => navigate('/children-management')}
          />
          <StatCard
            title="Active Classes"
            value={classes.length}
            subtitle="Classes today"
            icon={Monitor}
            iconColor="text-purple-600"
            actionLabel="View Classes"
            onAction={() => navigate('/classes-management')}
          />
          <StatCard
            title="Messages"
            value={3}
            subtitle="Unread messages"
            icon={MessageSquare}
            iconColor="text-orange-600"
            actionLabel="View All"
            onAction={() => {}}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all hover:shadow-md ${action.featured ? 'ring-2 ring-blue-200' : ''}`}
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    {action.featured && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Monitor className="h-3 w-3 mr-1" />
                        Live Updates
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Classes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Today's Classes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/classes-management')}>
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <div key={classItem.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{classItem.name}</h4>
                        <p className="text-xs text-gray-500">{classItem.age_range} • {classItem.room && `Room ${classItem.room}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {attendance.filter(a => a.class_id === classItem.id && !a.checked_out_at).length} present
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/check-in-out?class=${classItem.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No classes scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Communications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Communications</CardTitle>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Messages
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMessages.map((message, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{message.parent}</p>
                      <Badge variant={message.type === 'sent' ? 'default' : 'secondary'} className="text-xs">
                        {message.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{message.message}</p>
                    <p className="text-xs text-gray-500">{message.time}</p>
                  </div>
                </div>
              ))}
              
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Send New Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
