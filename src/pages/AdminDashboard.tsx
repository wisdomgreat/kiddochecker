
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
  GraduationCap, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  MoreHorizontal,
  Eye,
  Settings
} from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { children } = useChildren();
  const { classes } = useClasses();
  const { attendance } = useAttendance();

  const todayAttendance = attendance.filter(record => 
    record.attendance_date === new Date().toISOString().split('T')[0]
  );
  const checkedInToday = todayAttendance.filter(record => !record.checked_out_at).length;
  const checkedOutToday = todayAttendance.filter(record => record.checked_out_at).length;

  const recentActivity = [
    { name: 'Emma Wilson', action: 'Checked in', class: 'Preschool Class', time: '9:45 AM', status: 'checked-in' },
    { name: 'Noah Johnson', action: 'Checked in', class: 'Elementary Class', time: '9:48 AM', status: 'checked-in' },
    { name: 'Olivia Smith', action: 'Checked out', class: 'Toddler Class', time: '11:30 AM', status: 'checked-out' },
    { name: 'Liam Brown', action: 'Checked out', class: 'Elementary Class', time: '11:32 AM', status: 'checked-out' },
    { name: 'Ava Davis', action: 'Checked in', class: 'Preschool Class', time: '11:40 AM', status: 'checked-in' },
  ];

  const alerts = [
    { type: 'allergy', message: 'Noah Johnson - Peanut allergy', class: 'Elementary Class', priority: 'high' },
    { type: 'request', message: 'Elementary Class needs assistance', priority: 'medium' },
    { type: 'system', message: 'Printer low on paper', priority: 'low' },
  ];

  const classStatus = [
    { name: 'Preschool Class', current: 12, capacity: 15, teachers: 2, room: '103' },
    { name: 'Toddler Class', current: 8, capacity: 12, teachers: 3, room: '101' },
    { name: 'Elementary Class', current: 15, capacity: 20, teachers: 2, room: '105' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Trends
            </Button>
            <Button onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today"
            value={checkedInToday}
            subtitle="Children checked in"
            icon={UserCheck}
            iconColor="text-green-600"
            actionLabel="View Details"
            onAction={() => navigate('/check-in-out')}
            trend={{ value: '12%', isPositive: true }}
          />
          <StatCard
            title="Today"
            value={checkedOutToday}
            subtitle="Children checked out"
            icon={Users}
            iconColor="text-blue-600"
            actionLabel="View Details"
            onAction={() => navigate('/check-in-out')}
          />
          <StatCard
            title="Active"
            value={classes.length}
            subtitle="Classes in session"
            icon={GraduationCap}
            iconColor="text-purple-600"
            actionLabel="Manage Classes"
            onAction={() => navigate('/classes-management')}
          />
          <StatCard
            title="Alerts"
            value={alerts.length}
            subtitle="Requires attention"
            icon={AlertTriangle}
            iconColor="text-red-600"
            actionLabel="Resolve Issues"
            onAction={() => {}}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/check-in-out')}>
                <Eye className="h-4 w-4 mr-2" />
                View All Activity
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.class}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={activity.status === 'checked-in' ? 'default' : 'secondary'}>
                        {activity.action}
                      </Badge>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Class Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Class Status</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/classes-management')}>
                <Settings className="h-4 w-4 mr-2" />
                Manage All Classes
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {classStatus.map((cls, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{cls.name}</h4>
                      <p className="text-xs text-gray-500">{cls.teachers} teachers • Room {cls.room}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {cls.current}/{cls.capacity}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(cls.current / cls.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.priority === 'high' ? 'bg-red-500' : 
                      alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 capitalize">{alert.type} • {alert.priority} priority</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
