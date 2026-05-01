
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  MessageSquare, 
  Bell, 
  History,
  QrCode,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useAttendance } from "@/hooks/useAttendance";
import { supabase } from "@/integrations/supabase/client";
import QRCodeGenerator from "@/components/qr/QRCodeGenerator";

interface Message {
  id: string;
  subject: string;
  content: string;
  sender: string;
  created_at: string;
  is_read: boolean;
}

const EnhancedParentDashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { toast } = useToast();
  
  const { children, isLoading: childrenLoading } = useChildren();
  const { attendance, checkOut, isCheckingOut, refetch } = useAttendance();

  // Get today's attendance for user's children
  const todayAttendance = attendance.filter(record => {
    const isToday = record.attendance_date === new Date().toISOString().split('T')[0];
    const isUserChild = children.some(child => child.id === record.child_id);
    return isToday && isUserChild;
  });

  // Get historical attendance based on selected period
  const getHistoricalAttendance = () => {
    const today = new Date();
    const startDate = new Date();
    
    if (selectedPeriod === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    } else {
      startDate.setMonth(today.getMonth() - 3); // 3 months for 'all'
    }

    return attendance.filter(record => {
      const recordDate = new Date(record.attendance_date);
      const isUserChild = children.some(child => child.id === record.child_id);
      return recordDate >= startDate && isUserChild;
    });
  };

  const checkedInChildren = todayAttendance.filter(record => !record.checked_out_at);
  const checkedOutChildren = todayAttendance.filter(record => record.checked_out_at);
  const historicalAttendance = getHistoricalAttendance();

  // Set up real-time subscription for attendance updates
  useEffect(() => {
    const channel = supabase
      .channel('parent-attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('Real-time attendance update:', payload);
          
          // Check if this update affects user's children
          const affectsUserChild = children.some(child => {
            // Handle different payload structures safely
            if (payload.new && typeof payload.new === 'object' && 'child_id' in payload.new) {
              return child.id === payload.new.child_id;
            }
            if (payload.old && typeof payload.old === 'object' && 'child_id' in payload.old) {
              return child.id === payload.old.child_id;
            }
            return false;
          });
          
          if (affectsUserChild) {
            refetch();
            
            if (payload.eventType === 'INSERT') {
              toast({
                title: "Check-in Confirmed",
                description: "Your child has been checked in successfully",
              });
            } else if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object' && 'checked_out_at' in payload.new && payload.new.checked_out_at) {
              toast({
                title: "Check-out Confirmed",
                description: "Your child has been checked out successfully",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [children, refetch, toast]);

  // Mock messages - in real app, fetch from database
  useEffect(() => {
    setMessages([
      {
        id: '1',
        subject: 'Great Day in Sunday School!',
        content: 'Your child had a wonderful time learning about friendship today.',
        sender: 'Teacher Sarah',
        created_at: new Date().toISOString(),
        is_read: false
      },
      {
        id: '2',
        subject: 'Reminder: Pick up by 6 PM',
        content: 'Please remember to pick up your child before 6 PM today.',
        sender: 'Admin',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        is_read: true
      }
    ]);
  }, []);

  const handleEmergencyCheckOut = async (attendanceId: string, childName: string) => {
    try {
      await checkOut(attendanceId);
      toast({
        title: "Emergency Check-out Successful",
        description: `${childName} has been marked for immediate pickup`,
      });
    } catch (error) {
      toast({
        title: "Check-out Failed",
        description: "Please contact staff for assistance",
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">My Children</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{messages.filter(m => !m.is_read).length}</p>
                <p className="text-sm text-gray-600">New Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <History className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{historicalAttendance.length}</p>
                <p className="text-sm text-gray-600">Total Visits</p>
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
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{child.first_name} {child.last_name}</h3>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">Age {child.age}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Checked in: {record.checked_in_at ? 
                            new Date(record.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                            : 'Unknown'}</span>
                        </div>
                        {record.class?.name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{record.class.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmergencyCheckOut(record.id, `${child.first_name} ${child.last_name}`)}
                        disabled={isCheckingOut}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Emergency Pickup
                      </Button>
                      {/* Show QR Code for checkout */}
                      <div className="text-center">
                        <QRCodeGenerator
                          attendanceId={record.id}
                          childName={`${child.first_name} ${child.last_name}`}
                          className={record.class?.name}
                          size={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Messages & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.slice(0, 3).map((message) => (
              <div key={message.id} className={`p-3 rounded-lg border ${message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{message.subject}</h4>
                      {!message.is_read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{message.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>From: {message.sender}</span>
                      <span>•</span>
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No messages yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-600" />
              Attendance History
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'all'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === 'week' ? 'Last Week' : period === 'month' ? 'Last Month' : 'All Time'}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {historicalAttendance.slice(0, 10).map((record) => {
              const child = children.find(c => c.id === record.child_id);
              if (!child) return null;
              
              return (
                <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{child.first_name} {child.last_name}</p>
                      <p className="text-xs text-gray-500">{record.class?.name || 'No class'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(record.attendance_date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>In: {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
                      {record.checked_out_at && (
                        <span>Out: {new Date(record.checked_out_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {historicalAttendance.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No attendance history found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedParentDashboard;

