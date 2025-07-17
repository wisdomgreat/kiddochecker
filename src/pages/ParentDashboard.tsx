
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Baby,
  Clock,
  Calendar,
  MessageSquare,
  Heart,
  AlertTriangle,
  MapPin,
  Phone,
  Plus,
  Eye
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import RoleGuard from "@/components/security/RoleGuard";

interface ParentChild {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  allergies: string;
  medical_info: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch parent's children
  const { data: children = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ["parent-children", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching children for parent:', user.id);
      
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
      
      if (error) {
        console.error('Error fetching children:', error);
        throw error;
      }
      
      console.log('Children found:', data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent attendance for children
  const { data: recentAttendance = [] } = useQuery({
    queryKey: ["recent-attendance", user?.id],
    queryFn: async () => {
      if (!user?.id || children.length === 0) return [];
      
      const childIds = children.map((child: ParentChild) => child.id);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          child_id,
          attendance_date,
          checked_in_at,
          checked_out_at,
          children (first_name, last_name)
        `)
        .in('child_id', childIds)
        .gte('attendance_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('attendance_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && children.length > 0,
  });

  // Fetch recent messages
  const { data: recentMessages = [] } = useQuery({
    queryKey: ["recent-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const childrenWithAllergies = children.filter((child: ParentChild) => child.allergies);

  return (
    <RoleGuard requireParentAccess>
      <ModernLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Parent Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here's what's happening with your children.</p>
            </div>
            <Button onClick={() => navigate('/children')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Child
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Children</p>
                    <p className="text-2xl font-bold">{children.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Allergies</p>
                    <p className="text-2xl font-bold">{childrenWithAllergies.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unread Messages</p>
                    <p className="text-2xl font-bold">{recentMessages.filter(m => !m.is_read).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Recent Check-ins</p>
                    <p className="text-2xl font-bold">{recentAttendance.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Children */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  My Children
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingChildren ? (
                  <div className="py-4 text-center">Loading children...</div>
                ) : children.length === 0 ? (
                  <div className="py-8 text-center">
                    <Baby className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No children registered</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first child to the system.
                    </p>
                    <Button onClick={() => navigate('/children')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Child
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child: ParentChild) => (
                      <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Baby className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{child.first_name} {child.last_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {child.age ? `${child.age} years old` : 'Age not set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {child.allergies && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Allergies
                            </Badge>
                          )}
                          {child.emergency_contact_name && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Emergency Contact
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAttendance.length === 0 ? (
                  <div className="py-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No recent attendance</h3>
                    <p className="text-muted-foreground">
                      Attendance records will appear here once your children start attending.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAttendance.slice(0, 5).map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{record.children?.first_name} {record.children?.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            In: {record.checked_in_at ? format(new Date(record.checked_in_at), 'HH:mm') : '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Out: {record.checked_out_at ? format(new Date(record.checked_out_at), 'HH:mm') : 'Still present'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentMessages.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No messages</h3>
                    <p className="text-muted-foreground">
                      Messages from teachers and staff will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.slice(0, 5).map((message: any) => (
                      <div key={message.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{message.subject || 'No Subject'}</h4>
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ModernLayout>
    </RoleGuard>
  );
};

export default ParentDashboard;
