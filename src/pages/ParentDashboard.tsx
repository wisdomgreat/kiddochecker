
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Plus, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useParentChildren } from '@/hooks/useChildren';
import { useAttendance } from '@/hooks/useAttendance';
import { useState } from 'react';
import AddEditChildDialog from '@/components/children/AddEditChildDialog';
import { useChildren } from '@/hooks/useChildren';

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: childrenWithClasses, isLoading: childrenLoading } = useParentChildren();
  const { attendance } = useAttendance();
  const { addChild, isAddingChild } = useChildren();
  const [showAddChild, setShowAddChild] = useState(false);

  console.log("ParentDashboard - Current user:", user?.id);

  // Filter attendance for current user's children
  const myChildrenAttendance = attendance.filter(record => 
    childrenWithClasses?.some(child => child.child_id === record.child_id)
  );

  const currentlyPresent = myChildrenAttendance.filter(record => !record.checked_out_at);

  const handleAddChild = (childData: any) => {
    addChild(childData);
    setShowAddChild(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-muted-foreground">
              Track your children's attendance and activities.
            </p>
          </div>
          <Button onClick={() => setShowAddChild(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">My Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{childrenWithClasses?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Registered children</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">Currently Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{currentlyPresent.length}</div>
              <p className="text-xs text-muted-foreground">At the facility</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium ml-2">Check-ins Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myChildrenAttendance.length}</div>
              <p className="text-xs text-muted-foreground">Total for today</p>
            </CardContent>
          </Card>
        </div>

        {/* My Children */}
        <Card>
          <CardHeader>
            <CardTitle>My Children</CardTitle>
          </CardHeader>
          <CardContent>
            {childrenLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : childrenWithClasses && childrenWithClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childrenWithClasses.map((child) => {
                  const childAttendance = myChildrenAttendance.find(
                    record => record.child_id === child.child_id && !record.checked_out_at
                  );
                  
                  return (
                    <Card key={child.child_id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {child.first_name} {child.last_name}
                          </CardTitle>
                          {childAttendance ? (
                            <Badge className="bg-green-600">Present</Badge>
                          ) : (
                            <Badge variant="secondary">Not Present</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {child.age && (
                            <div className="flex justify-between text-sm">
                              <span>Age:</span>
                              <span className="font-medium">{child.age} years</span>
                            </div>
                          )}
                          
                          {child.current_class_name && (
                            <div className="flex justify-between text-sm">
                              <span>Current Class:</span>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 text-gray-500" />
                                <span className="font-medium">{child.current_class_name}</span>
                              </div>
                            </div>
                          )}
                          
                          {child.allergies && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-red-600">Allergies:</span>
                              <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">
                                {child.allergies}
                              </p>
                            </div>
                          )}
                          
                          {childAttendance && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span>Checked in: </span>
                              <span className="font-medium">
                                {new Date(childAttendance.checked_in_at!).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No children registered yet.</p>
                <Button onClick={() => setShowAddChild(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Child
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {myChildrenAttendance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myChildrenAttendance.slice(0, 5).map((record) => {
                  const child = childrenWithClasses?.find(c => c.child_id === record.child_id);
                  return (
                    <div key={record.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">
                          {child?.first_name} {child?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.class?.name || 'No class assigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {record.checked_out_at ? 'Checked out' : 'Checked in'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.checked_out_at || record.checked_in_at!).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <AddEditChildDialog
          isOpen={showAddChild}
          onClose={() => setShowAddChild(false)}
          onSave={handleAddChild}
          isLoading={isAddingChild}
        />
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
