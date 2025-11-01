
import { useState, useEffect } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  UserCheck,
  UserX,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  UserPlus
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckInDialog } from "@/components/attendance/CheckInDialog";
import { ClassAttendanceReport } from "@/components/attendance/ClassAttendanceReport";

// Updated interface to match the database function return type
interface DetailedAttendanceRecord {
  attendance_date: string;
  child_name: string;
  class_name: string;
  check_in_time: string;
  check_out_time: string;
  duration_hours: number;
}

const AttendanceManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);

  // Fetch attendance data using the detailed report function
  const { data: attendanceData = [], isLoading, refetch } = useQuery({
    queryKey: ["attendance-detailed", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: selectedDate,
        end_date: selectedDate
      });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch daily stats
  const { data: dailyStats } = useQuery({
    queryKey: ["daily-stats", selectedDate],
    queryFn: async () => {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('id, checked_in_at, checked_out_at')
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;

      const totalCheckedIn = attendance?.length || 0;
      const stillPresent = attendance?.filter(a => a.checked_in_at && !a.checked_out_at).length || 0;
      const checkedOut = attendance?.filter(a => a.checked_out_at).length || 0;

      return {
        totalCheckedIn,
        stillPresent,
        checkedOut
      };
    },
  });

  // Fetch attendance records for check-out functionality
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["attendance-records", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          child_id,
          checked_in_at,
          checked_out_at,
          children (first_name, last_name)
        `)
        .eq('attendance_date', selectedDate)
        .is('checked_out_at', null);
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleCheckOut = async (childName: string) => {
    try {
      // Find the attendance record for this child
      const attendanceRecord = attendanceRecords.find(
        record => `${record.children?.first_name} ${record.children?.last_name}` === childName
      );

      if (!attendanceRecord) {
        toast({
          title: "Error",
          description: "Could not find attendance record for this child",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .update({ 
          checked_out_at: new Date().toISOString(),
          checked_out_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', attendanceRecord.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child checked out successfully",
      });

      refetch();
      queryClient.invalidateQueries({ queryKey: ["daily-stats"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredData = attendanceData.filter((record: DetailedAttendanceRecord) => {
    const matchesSearch = record.child_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.class_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "present") return matchesSearch && !record.check_out_time;
    if (statusFilter === "checked_out") return matchesSearch && record.check_out_time;
    return matchesSearch;
  });

  const attendanceColumns = [
    {
      key: "child_name" as const,
      header: "Child Name",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "class_name" as const,
      header: "Class",
      render: (value: string) => value || "No Class",
    },
    {
      key: "check_in_time" as const,
      header: "Check In",
      render: (value: string) => value ? format(new Date(value), 'HH:mm') : "-",
    },
    {
      key: "check_out_time" as const,
      header: "Check Out",
      render: (value: string | null, record: DetailedAttendanceRecord) => (
        <div className="flex items-center gap-2">
          {value ? (
            <span>{format(new Date(value), 'HH:mm')}</span>
          ) : (
            <Badge variant="secondary">Present</Badge>
          )}
        </div>
      ),
    },
    {
      key: "duration_hours" as const,
      header: "Duration",
      render: (value: number | null) => {
        if (!value) return "-";
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return `${hours}h ${minutes}m`;
      },
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, record: DetailedAttendanceRecord) => (
        !record.check_out_time ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCheckOut(record.child_name)}
          >
            <UserX className="h-4 w-4 mr-1" />
            Check Out
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">Completed</span>
        )
      ),
    },
  ];

  const exportToCSV = () => {
    const csvContent = [
      ['Child Name', 'Class', 'Check In', 'Check Out', 'Duration'],
      ...filteredData.map(record => [
        record.child_name,
        record.class_name || '',
        record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '',
        record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm') : '',
        record.duration_hours ? `${Math.floor(record.duration_hours)}h ${Math.round((record.duration_hours - Math.floor(record.duration_hours)) * 60)}m` : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Track daily attendance and check-in/out</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCheckInDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manual Check-In
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                  <p className="text-2xl font-bold">{dailyStats?.totalCheckedIn || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Still Present</p>
                  <p className="text-2xl font-bold">{dailyStats?.stillPresent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold">{dailyStats?.checkedOut || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-medium">{format(new Date(selectedDate), 'MMM dd')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by child name or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Still Present</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Attendance Report */}
        <ClassAttendanceReport selectedDate={selectedDate} />

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Daily Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading attendance data...</div>
            ) : filteredData.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No attendance records</h3>
                <p className="text-muted-foreground">
                  No attendance records found for the selected date and filters.
                </p>
              </div>
            ) : (
              <DataTable
                columns={attendanceColumns}
                data={filteredData}
                keyExtractor={(item) => `${item.child_name}-${item.attendance_date}`}
              />
            )}
          </CardContent>
        </Card>

        <CheckInDialog
          open={showCheckInDialog}
          onOpenChange={setShowCheckInDialog}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["daily-stats"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
          }}
        />
      </div>
    </ModernLayout>
  );
};

export default AttendanceManagement;
