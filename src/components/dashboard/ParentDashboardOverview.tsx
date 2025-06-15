
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, User, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useAttendance } from "@/hooks/useAttendance";
import MobileCheckInForm from "@/components/check-in/MobileCheckInForm";

const ParentDashboardOverview = () => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const { toast } = useToast();
  
  const { children, isLoading: childrenLoading } = useChildren();
  const { attendance, checkOut, isCheckingOut } = useAttendance();

  // Get today's attendance for user's children
  const todayAttendance = attendance.filter(record => {
    const isToday = record.attendance_date === new Date().toISOString().split('T')[0];
    const isUserChild = children.some(child => child.id === record.child_id);
    return isToday && isUserChild;
  });

  const checkedInChildren = todayAttendance.filter(record => !record.checked_out_at);
  const checkedOutChildren = todayAttendance.filter(record => record.checked_out_at);

  const handleCheckOut = async (attendanceId: string, childName: string) => {
    try {
      await checkOut(attendanceId);
      toast({
        title: "Check-out successful",
        description: `${childName} has been checked out successfully`,
      });
    } catch (error) {
      toast({
        title: "Check-out failed",
        description: "Please try again or contact staff for assistance",
        variant: "destructive",
      });
    }
  };

  if (childrenLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{checkedInChildren.length}</p>
                <p className="text-sm text-gray-600">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{children.length}</p>
                <p className="text-sm text-gray-600">Total Children</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Checked In */}
      {checkedInChildren.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Currently Checked In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkedInChildren.map((record) => {
              const child = children.find(c => c.id === record.child_id);
              if (!child) return null;
              
              return (
                <div key={record.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{child.first_name} {child.last_name}</h3>
                      <Badge variant="outline" className="text-xs">Age {child.age}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {record.checked_in_at ? 
                            new Date(record.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                            : 'Unknown'
                          }
                        </span>
                      </div>
                      {record.class?.name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{record.class.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCheckOut(record.id, `${child.first_name} ${child.last_name}`)}
                    disabled={isCheckingOut}
                  >
                    Check Out
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Check-in Form */}
      {showCheckIn ? (
        <div>
          <MobileCheckInForm onSuccess={() => setShowCheckIn(false)} />
          <div className="text-center mt-4">
            <Button variant="outline" onClick={() => setShowCheckIn(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Quick Actions</h3>
              <Button 
                onClick={() => setShowCheckIn(true)}
                className="w-full py-6"
                size="lg"
              >
                <User className="mr-2 h-5 w-5" />
                Check In Child
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Activity Summary */}
      {todayAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total check-ins today:</span>
                <span className="font-medium">{todayAttendance.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Still checked in:</span>
                <span className="font-medium text-green-600">{checkedInChildren.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Checked out:</span>
                <span className="font-medium text-gray-600">{checkedOutChildren.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No children message */}
      {children.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No Children Added</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Contact the administrator to add your children to the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentDashboardOverview;
