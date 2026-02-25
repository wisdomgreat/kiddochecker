import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/CleanAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, User, Calendar } from "lucide-react";

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

      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user?.id);

      if (childrenError) throw childrenError;

      setChildren(childrenData || []);

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
          <div className="text-center">Loading attendance data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records found
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              initial="hidden"
              animate="show"
            >
              {attendance.map((record) => (
                <motion.div
                  key={record.id}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 }
                  }}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{getChildName(record.child_id)}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(record.attendance_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>
                          In: {record.checked_in_at ?
                            new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Not checked in'}
                        </span>
                      </div>
                      {record.checked_out_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            Out: {new Date(record.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTracking;
