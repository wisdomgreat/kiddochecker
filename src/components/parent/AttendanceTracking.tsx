import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, Calendar } from "lucide-react";

interface AttendanceRecord {
  id: string;
  child_id: string;
  class_id: string | null;
  attendance_date: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  checked_in_by: string | null;
  checked_out_by: string | null;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age?: number;
}

const AttendanceTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.warn("AttendanceTracking: No user ID available for fetch");
        setLoading(false);
        return;
      }

      console.log("AttendanceTracking: Fetching children for parent:", user.id);
      
      // Fetch children using the RPC for consistency and to bypass RLS issues
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_parent_children_with_classes', {
        parent_user_id: user.id
      });
      
      if (rpcError) {
        console.error("AttendanceTracking: RPC Error fetching children:", rpcError);
        throw rpcError;
      }
      
      console.log("AttendanceTracking: Found children:", rpcData?.length || 0);
      
      const childrenData = (rpcData || []).map((child: any) => ({
        id: child.child_id,
        first_name: child.first_name,
        last_name: child.last_name,
        age: child.age
      }));

      setChildren(childrenData);

      // Fetch attendance records for children
      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map(child => child.id);

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .in('child_id', childIds)
          .order('attendance_date', { ascending: false })
          .limit(20);

        if (attendanceError) throw attendanceError;

        setAttendance(attendanceData || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child ? `${child.first_name} ${child.last_name}` : 'Unknown Child';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 animate-pulse" />
            Loading attendance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {attendance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
              No attendance records found
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center border border-primary/20">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm tracking-tight">{getChildName(record.child_id)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.attendance_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5 text-xs font-medium">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          In: {record.checked_in_at ?
                            new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Not checked in'}
                        </span>
                      </div>
                      {record.checked_out_at && (
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Out: {new Date(record.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTracking;


