
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle,
  MessageSquare,
  Calendar,
  QrCode,
  Plus,
  Clock,
  MapPin,
  Bell
} from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useAttendance } from '@/hooks/useAttendance';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { children } = useChildren();
  const { attendance } = useAttendance();

  // Get today's attendance for user's children
  const todayAttendance = attendance.filter(record => {
    const isToday = record.attendance_date === new Date().toISOString().split('T')[0];
    const isUserChild = children.some(child => child.id === record.child_id);
    return isToday && isUserChild;
  });

  const checkedInChildren = todayAttendance.filter(record => !record.checked_out_at);
  const checkedOutChildren = todayAttendance.filter(record => record.checked_out_at);

  const upcomingEvents = [
    { name: 'Sunday School', date: 'This Sunday', time: '9:00 AM - 12:00 PM', location: 'Room 103' },
    { name: "Children's Choir", date: 'Wednesday', time: '6:00 PM - 7:30 PM', location: 'Main Hall' },
    { name: 'Family Day', date: 'Next Sunday', time: '10:00 AM - 2:00 PM', location: 'Church Grounds' },
  ];

  const recentNotes = [
    { teacher: 'Ms. Wilson', message: 'Emma had a great day in class!', time: 'Today, 11:15 AM', child: 'Emma' },
    { teacher: 'Mr. Thomas', message: 'Noah participated well in group activities', time: 'Today, 10:45 AM', child: 'Noah' },
    { teacher: 'Ms. Wilson', message: 'Emma needs to bring her Bible next Sunday', time: 'Yesterday, 12:30 PM', child: 'Emma' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, Sarah!</h1>
            <p className="text-gray-600 mt-1">Stay connected with your children's activities and updates.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button onClick={() => navigate('/children')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Checked In"
            value={checkedInChildren.length}
            subtitle="Children present today"
            icon={CheckCircle}
            iconColor="text-green-600"
            actionLabel="View Details"
            onAction={() => {}}
          />
          <StatCard
            title="My Children"
            value={children.length}
            subtitle="Registered children"
            icon={Users}
            iconColor="text-blue-600"
            actionLabel="Manage"
            onAction={() => navigate('/children')}
          />
          <StatCard
            title="New Messages"
            value={3}
            subtitle="From teachers"
            icon={MessageSquare}
            iconColor="text-purple-600"
            actionLabel="Read All"
            onAction={() => {}}
          />
          <StatCard
            title="Upcoming"
            value={upcomingEvents.length}
            subtitle="Events this week"
            icon={Calendar}
            iconColor="text-orange-600"
            actionLabel="View Calendar"
            onAction={() => {}}
          />
        </div>

        {/* Children Status */}
        {checkedInChildren.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Currently Checked In
                <Badge variant="outline" className="bg-green-50 text-green-700 ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkedInChildren.map((record) => {
                const child = children.find(c => c.id === record.child_id);
                if (!child) return null;
                
                return (
                  <div key={record.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{child.first_name} {child.last_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Checked in: {record.checked_in_at ? 
                                new Date(record.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                : 'Unknown'}</span>
                            </div>
                            {record.class?.name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{record.class.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <QrCode className="h-4 w-4 mr-2" />
                          Pickup QR
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                          Emergency Pickup
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Teacher Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Teacher Notes</CardTitle>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Messages
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentNotes.map((note, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{note.child}</h4>
                        <Badge variant="outline" className="text-xs">New</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{note.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>From: {note.teacher}</span>
                        <span>{note.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{event.name}</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{event.date} • {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Register Child</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <QrCode className="h-6 w-6" />
                <span>Generate Pickup QR</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <MessageSquare className="h-6 w-6" />
                <span>Contact Teacher</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
