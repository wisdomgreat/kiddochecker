
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { 
  ClipboardCheck, 
  Users, 
  Calendar,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle,
  Monitor,
  BookOpen
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const StaffDashboard = () => {
  const navigate = useNavigate();

  // Get today's attendance stats
  const { data: todayStats = { checkedIn: 0, checkedOut: 0, total: 0 } } = useQuery({
    queryKey: ['today-attendance-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('attendance_date', today);
      
      if (error) throw error;
      
      const checkedIn = data?.filter(record => record.checked_in_at && !record.checked_out_at).length || 0;
      const checkedOut = data?.filter(record => record.checked_out_at).length || 0;
      const total = data?.length || 0;
      
      return { checkedIn, checkedOut, total };
    }
  });

  // Get total children count
  const { data: childrenCount = 0 } = useQuery({
    queryKey: ['total-children'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Get classes count
  const { data: classesCount = 0 } = useQuery({
    queryKey: ['total-classes'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const quickActions = [
    {
      title: 'Check-In/Out',
      description: 'Manage attendance',
      icon: ClipboardCheck,
      path: '/check-in-out',
      color: 'bg-blue-500'
    },
    {
      title: 'Open Kiosk Mode',
      description: 'Self-service check-in',
      icon: Monitor,
      path: '/check-in-kiosk',
      color: 'bg-green-500',
      external: true
    },
    {
      title: 'Reports',
      description: 'View attendance reports',
      icon: BarChart3,
      path: '/reports',
      color: 'bg-purple-500'
    },
    {
      title: 'Calendar',
      description: 'View events and schedules',
      icon: Calendar,
      path: '/calendar',
      color: 'bg-orange-500'
    },
    {
      title: 'Family Connect',
      description: 'Communication center',
      icon: MessageSquare,
      path: '/family-connect',
      color: 'bg-pink-500'
    },
    {
      title: 'Classes',
      description: 'View class information',
      icon: BookOpen,
      path: '/classes-management',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Dashboard</h1>
            <p className="text-muted-foreground">Manage attendance and interact with families.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => navigate('/check-in-out')}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Check-In/Out
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/check-in-kiosk', '_blank', 'fullscreen=yes')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Kiosk Mode
            </Button>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{todayStats.checkedIn}</div>
              <p className="text-xs text-muted-foreground">Children checked in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{todayStats.checkedOut}</div>
              <p className="text-xs text-muted-foreground">Children checked out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{childrenCount}</div>
              <p className="text-xs text-muted-foreground">Registered children</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{classesCount}</div>
              <p className="text-xs text-muted-foreground">Available classes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.path}>
                  {action.external ? (
                    <button
                      onClick={() => window.open(action.path, '_blank', 'fullscreen=yes')}
                      className="w-full"
                    >
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${action.color}`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{action.title}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </CardContent>
                      </Card>
                    </button>
                  ) : (
                    <Link to={action.path}>
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${action.color}`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{action.title}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Today's Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{todayStats.checkedIn}</div>
                <div className="text-sm text-green-700">Currently Present</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{todayStats.checkedOut}</div>
                <div className="text-sm text-orange-700">Checked Out Today</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{todayStats.total}</div>
                <div className="text-sm text-blue-700">Total Visits Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default StaffDashboard;
