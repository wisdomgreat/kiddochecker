
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, User, Download } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const AttendanceTracking = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"week" | "month">("week");

  const { data: children = [] } = useQuery({
    queryKey: ["parent-children", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (error) {
        console.error("Error fetching children:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["parent-attendance", user?.id, dateRange],
    queryFn: async () => {
      if (!user || children.length === 0) return [];

      const now = new Date();
      const startDate = dateRange === "week" ? startOfWeek(now) : startOfMonth(now);
      const endDate = dateRange === "week" ? endOfWeek(now) : endOfMonth(now);

      const childIds = children.map(child => child.id);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children:child_id(first_name, last_name)
        `)
        .in('child_id', childIds)
        .gte('attendance_date', startDate.toISOString().split('T')[0])
        .lte('attendance_date', endDate.toISOString().split('T')[0])
        .order('attendance_date', { ascending: false });

      if (error) {
        console.error("Error fetching attendance:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user && children.length > 0,
  });

  const exportAttendance = () => {
    const csvContent = [
      ['Child Name', 'Date', 'Check In', 'Check Out', 'Duration'].join(','),
      ...attendance.map(record => [
        `${record.children?.first_name} ${record.children?.last_name}`,
        format(new Date(record.attendance_date), 'MM/dd/yyyy'),
        record.checked_in_at ? format(new Date(record.checked_in_at), 'HH:mm') : '',
        record.checked_out_at ? format(new Date(record.checked_out_at), 'HH:mm') : 'Still present',
        record.checked_in_at && record.checked_out_at 
          ? `${Math.round((new Date(record.checked_out_at).getTime() - new Date(record.checked_in_at).getTime()) / (1000 * 60))} minutes`
          : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${dateRange}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Tracking</h2>
          <p className="text-gray-600">View your children's attendance history</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            onClick={() => setDateRange("week")}
            size="sm"
          >
            This Week
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => setDateRange("month")}
            size="sm"
          >
            This Month
          </Button>
          <Button onClick={exportAttendance} size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No children registered</h3>
            <p className="text-gray-500">Add children to view their attendance records.</p>
          </CardContent>
        </Card>
      ) : attendance.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
            <p className="text-gray-500">
              Attendance records for the selected period will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {children.map(child => {
            const childAttendance = attendance.filter(record => record.child_id === child.id);
            const presentDays = childAttendance.length;
            
            return (
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {child.first_name} {child.last_name}
                    </span>
                    <Badge variant="outline">
                      {presentDays} day{presentDays !== 1 ? 's' : ''} present
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {childAttendance.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No attendance records for this period
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {childAttendance.map(record => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {format(new Date(record.attendance_date), 'EEE, MMM dd')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-600" />
                              <span>In: {record.checked_in_at ? format(new Date(record.checked_in_at), 'HH:mm') : '-'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-red-600" />
                              <span>Out: {record.checked_out_at ? format(new Date(record.checked_out_at), 'HH:mm') : 'Still present'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;
