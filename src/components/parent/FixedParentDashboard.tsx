
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Calendar, MessageCircle, User, QrCode } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import useParentChildren from '@/hooks/useParentChildren';
import { useAttendance } from '@/hooks/useAttendance';

const FixedParentDashboard = () => {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useParentChildren();
  const { attendance } = useAttendance();

  const todaysAttendance = attendance.filter(record => 
    new Date(record.attendance_date).toDateString() === new Date().toDateString()
  );

  const checkedInChildren = todaysAttendance.filter(record => 
    record.checked_in_at && !record.checked_out_at
  ).length;

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.user_metadata?.first_name || 'Parent'}!
        </h1>
        <p className="text-muted-foreground">
          Today is {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">Registered children</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInChildren}</div>
            <p className="text-xs text-muted-foreground">Currently present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAttendance.length}</div>
            <p className="text-xs text-muted-foreground">Total check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Children
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No children registered</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your children to the system.
              </p>
              <Button>Add Child</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const isCheckedIn = todaysAttendance.some(record => 
                  record.child_id === child.child_id && 
                  record.checked_in_at && 
                  !record.checked_out_at
                );

                return (
                  <Card key={child.child_id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {child.first_name} {child.last_name}
                        </CardTitle>
                        <Badge variant={isCheckedIn ? "default" : "secondary"}>
                          {isCheckedIn ? "Present" : "Not Present"}
                        </Badge>
                      </div>
                      {child.age && (
                        <p className="text-sm text-muted-foreground">Age: {child.age}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {child.current_class_name && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{child.current_class_name}</span>
                        </div>
                      )}
                      
                      {child.allergies && (
                        <div className="bg-red-50 p-2 rounded text-sm">
                          <strong>Allergies:</strong> {child.allergies}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <User className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex-col gap-2">
              <Users className="h-6 w-6" />
              Manage Children
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              View Attendance
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <MessageCircle className="h-6 w-6" />
              Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedParentDashboard;
