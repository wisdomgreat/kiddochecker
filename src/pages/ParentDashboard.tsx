
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Baby, 
  Calendar,
  MessageSquare,
  QrCode,
  Clock,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get parent's children
  const { data: children = [] } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Get today's attendance for parent's children
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['today-attendance', user?.id],
    queryFn: async () => {
      if (!user?.id || children.length === 0) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const childIds = children.map(child => child.id);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children(first_name, last_name),
          classes(name)
        `)
        .in('child_id', childIds)
        .eq('attendance_date', today);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && children.length > 0
  });

  // Get unread messages
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });

  const currentlyPresent = todayAttendance.filter(record => !record.checked_out_at);
  const checkedOut = todayAttendance.filter(record => record.checked_out_at);

  const quickActions = [
    {
      title: 'My Children',
      description: 'View and manage your children',
      icon: Baby,
      path: '/children-management',
      color: 'bg-blue-500'
    },
    {
      title: 'Calendar',
      description: 'View upcoming events',
      icon: Calendar,
      path: '/calendar',
      color: 'bg-green-500'
    },
    {
      title: 'Messages',
      description: 'Communicate with staff',
      icon: MessageSquare,
      path: '/family-connect',
      color: 'bg-purple-500',
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    {
      title: 'Check-In Kiosk',
      description: 'Quick check-in access',
      icon: QrCode,
      path: '/check-in-kiosk',
      color: 'bg-orange-500',
      external: true
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your children today.</p>
          </div>
          <Button onClick={() => navigate('/children-management')} className="bg-primary">
            <Baby className="h-4 w-4 mr-2" />
            Manage Children
          </Button>
        </div>

        {/* Today's Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{currentlyPresent.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{checkedOut.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadMessages}</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance Details */}
        {todayAttendance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${record.checked_out_at ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      <div>
                        <p className="font-medium">{record.children?.first_name} {record.children?.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.classes?.name ? `Class: ${record.classes.name}` : 'No class assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Check-in: {new Date(record.checked_in_at).toLocaleTimeString()}
                      </p>
                      {record.checked_out_at && (
                        <p className="text-sm text-muted-foreground">
                          Check-out: {new Date(record.checked_out_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {action.title}
                                {action.badge && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {action.badge}
                                  </span>
                                )}
                              </CardTitle>
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
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {action.title}
                                {action.badge && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {action.badge}
                                  </span>
                                )}
                              </CardTitle>
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

        {/* No Children Message */}
        {children.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                No Children Registered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You haven't registered any children yet. Add your children to start using the check-in system.
              </p>
              <Button onClick={() => navigate('/children-management')}>
                <Baby className="h-4 w-4 mr-2" />
                Add Your First Child
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ParentDashboard;
