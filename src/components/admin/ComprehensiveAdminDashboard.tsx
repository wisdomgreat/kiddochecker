
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Settings, 
  BarChart3, 
  Monitor,
  Clock,
  School,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAdminUserManagement } from '@/hooks/useAdminUserManagement';
import { useAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import AdminUserManagement from './AdminUserManagement';

const ComprehensiveAdminDashboard = () => {
  const { users, isLoading: usersLoading } = useAdminUserManagement();
  const { attendance } = useAttendance();
  const { classes } = useClasses();

  const todaysAttendance = attendance.filter(record => 
    new Date(record.attendance_date).toDateString() === new Date().toDateString()
  );

  const checkedInToday = todaysAttendance.filter(record => 
    record.checked_in_at && !record.checked_out_at
  ).length;

  const totalCheckInsToday = todaysAttendance.length;

  const adminUsers = users.filter(user => 
    user.role === 'admin' || user.role === 'super_admin' || user.is_super_admin
  );

  const staffUsers = users.filter(user => 
    ['staff', 'teacher', 'teacher_assistant'].includes(user.role)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and management controls
        </p>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {adminUsers.length} admin{adminUsers.length !== 1 ? 's' : ''}, {staffUsers.length} staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInToday}</div>
            <p className="text-xs text-muted-foreground">
              {totalCheckInsToday} total check-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Classes configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex-col gap-2">
                  <UserPlus className="h-6 w-6" />
                  Add User
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <School className="h-6 w-6" />
                  Manage Classes
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Monitor className="h-6 w-6" />
                  Device Setup
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysAttendance.slice(0, 5).map((record, index) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">{record.child?.first_name} {record.child?.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.checked_out_at ? 'Checked out' : 'Checked in'} 
                          {record.class?.name && ` - ${record.class.name}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={record.checked_out_at ? "secondary" : "default"}>
                      {new Date(record.checked_in_at || '').toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Badge>
                  </div>
                ))}
                
                {todaysAttendance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity today yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{record.child?.first_name} {record.child?.last_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {record.class?.name || 'No class assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={record.checked_out_at ? "secondary" : "default"}>
                        {record.checked_out_at ? "Checked Out" : "Present"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        In: {new Date(record.checked_in_at || '').toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {record.checked_out_at && (
                          <> | Out: {new Date(record.checked_out_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                
                {todaysAttendance.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No attendance records today</h3>
                    <p className="text-muted-foreground">
                      Attendance records will appear here as children check in.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Class Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((classItem) => (
                  <Card key={classItem.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      {classItem.description && (
                        <p className="text-sm text-muted-foreground">{classItem.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {classItem.age_range && (
                        <p className="text-sm"><strong>Age Range:</strong> {classItem.age_range}</p>
                      )}
                      {classItem.capacity && (
                        <p className="text-sm"><strong>Capacity:</strong> {classItem.capacity}</p>
                      )}
                      {classItem.room && (
                        <p className="text-sm"><strong>Room:</strong> {classItem.room}</p>
                      )}
                      <Button size="sm" variant="outline" className="mt-3">
                        Manage Class
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {classes.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No classes configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by creating your first class.
                    </p>
                    <Button>Add Class</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No devices registered</h3>
                <p className="text-muted-foreground mb-4">
                  Register check-in kiosks and other devices here.
                </p>
                <Button>Register Device</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Organization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Organization Settings
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Security Settings
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Notification Settings
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Backup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Backup Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveAdminDashboard;

