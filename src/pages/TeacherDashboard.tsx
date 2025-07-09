
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
  MessageSquare,
  Calendar,
  Clock,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { children } = useChildren();
  const { classes } = useClasses();
  const { attendance } = useAttendance();

  const currentlyPresent = attendance.filter(record => !record.checked_out_at);

  const myClasses = [
    { id: '1', name: 'Sunday School - Ages 5-7', time: 'Sundays 10:00 AM - 11:30 AM', room: 'Room 103', students: 12, present: 8 },
    { id: '2', name: 'Wednesday Bible Study - Ages 6-8', time: 'Wednesdays 6:30 PM - 7:45 PM', room: 'Room 105', students: 15, present: 12 },
  ];

  const recentNotes = [
    { student: 'Emma Wilson', note: 'Children enjoyed the Noah\'s Ark craft activity', date: 'May 12, 2024', class: 'Sunday School - Ages 5-7' },
    { student: 'Noah Thompson', note: 'Focused on memorizing John 3:16, most students participated well', date: 'May 8, 2024', class: 'Wednesday Bible Study' },
    { student: 'Olivia Martinez', note: 'Discussed the Good Samaritan, had great discussions', date: 'May 5, 2024', class: 'Sunday School - Ages 5-7' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your classes and track student progress.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/classes-management')}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Manage Classes
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
            title="My Classes"
            value={myClasses.length}
            subtitle="Classes assigned to you"
            icon={GraduationCap}
            iconColor="text-green-600"
            actionLabel="View All"
            onAction={() => navigate('/classes-management')}
          />
          <StatCard
            title="Students"
            value={children.length}
            subtitle="Total students"
            icon={Users}
            iconColor="text-blue-600"
            actionLabel="Manage"
            onAction={() => navigate('/children-management')}
          />
          <StatCard
            title="Present Today"
            value={currentlyPresent.length}
            subtitle="Currently checked in"
            icon={UserCheck}
            iconColor="text-purple-600"
            actionLabel="View Live"
            onAction={() => navigate('/check-in-out')}
          />
          <StatCard
            title="Experience"
            value="3 Years"
            subtitle="Teaching at our church"
            icon={Calendar}
            iconColor="text-orange-600"
          />
        </div>

        {/* Current Class Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Current Class Assignments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/classes-management')}>
              <Eye className="h-4 w-4 mr-2" />
              View All Classes
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {myClasses.map((cls) => (
              <div key={cls.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{cls.name}</h4>
                    <p className="text-sm text-gray-600">{cls.time} • {cls.room}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {cls.present}/{cls.students} present
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(cls.present / cls.students) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teaching Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Teaching Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">3 Years</p>
                  <p className="text-sm text-gray-600">Experience</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">156 Children</p>
                  <p className="text-sm text-gray-600">Taught since joining</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">98% Rate</p>
                  <p className="text-sm text-gray-600">Class attendance record</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Class Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Class Notes</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentNotes.map((note, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{note.class}</h4>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{note.note}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{note.date}</span>
                    <Badge variant="outline" className="text-xs">Class Note</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">sarah.johnson@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">(555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Emergency Contact</p>
                  <p className="text-sm text-gray-600">Michael Johnson (Husband) - (555) 987-6543</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
