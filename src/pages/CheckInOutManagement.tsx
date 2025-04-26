import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";
import { Search, CheckCircle, X, RefreshCcw, LogOut, Clock, CalendarClock, Users, School, Download, Filter, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AttendanceRecord {
  id: string;
  childId: string;
  classId?: string;
  childName: string;
  className?: string;
  checkedInAt: string;
  checkedOutAt?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
  allergies?: string | null;
  elapsedTime?: string;
  status?: string;
}

const CheckInOutManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"present" | "all">("present");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { todayCount, refreshData } = useRealtimeAttendance({
    onCheckIn: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast({
        title: "New Check-in",
        description: "A new check-in has been recorded",
      });
    },
    onCheckOut: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast({
        title: "Check-out",
        description: "A child has been checked out",
      });
    },
  });

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ["attendance-records"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id,
            child_id,
            class_id,
            checked_in_at,
            checked_out_at,
            checked_in_by,
            checked_out_by,
            children:child_id (first_name, last_name, allergies),
            classes:class_id (name)
          `)
          .eq('attendance_date', today)
          .order('checked_in_at', { ascending: false });
          
        if (error) throw error;
        
        return data.map((record): AttendanceRecord => {
          const firstName = record.children?.first_name || '';
          const lastName = record.children?.last_name || '';
          
          return {
            id: record.id,
            childId: record.child_id,
            classId: record.class_id,
            childName: `${firstName} ${lastName}`,
            className: record.classes?.name,
            checkedInAt: record.checked_in_at,
            checkedOutAt: record.checked_out_at,
            checkedInBy: record.checked_in_by,
            checkedOutBy: record.checked_out_by,
            allergies: record.children?.allergies,
          };
        });
      } catch (error: any) {
        console.error("Error fetching attendance records:", error);
        toast({
          title: "Error",
          description: `Failed to load attendance records: ${error.message}`,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (recordId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('attendance')
        .update({
          checked_out_at: new Date().toISOString(),
          checked_out_by: user.id
        })
        .eq('id', recordId)
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Child has been checked out successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      setIsCheckoutDialogOpen(false);
      setSelectedRecord(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to check out child: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const filteredRecords = attendanceRecords.filter((record) => {
    const searchMatch =
      record.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.className?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
    if (activeTab === "present") {
      return !record.checkedOutAt && searchMatch;
    }
    
    return searchMatch;
  });

  const handleCheckoutClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsCheckoutDialogOpen(true);
  };
  
  const confirmCheckout = () => {
    if (selectedRecord) {
      checkoutMutation.mutate(selectedRecord.id);
    }
  };

  const statsData = [
    {
      title: "Currently Present",
      value: todayCount.checkedIn - todayCount.checkedOut,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      description: "Children currently checked in",
    },
    {
      title: "Total Check-ins Today",
      value: todayCount.checkedIn,
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      description: "Children who have checked in today",
    },
    {
      title: "Total Check-outs",
      value: todayCount.checkedOut,
      icon: <LogOut className="h-4 w-4 text-amber-600" />,
      description: "Children who have checked out today",
    },
  ];

  const attendanceColumns = [
    {
      key: "childName" as keyof AttendanceRecord,
      header: "Child",
      render: (value: string, record: AttendanceRecord) => (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {record.childName.split(' ').map(name => name[0]).join('')}
            </span>
          </div>
          <div>
            <div className="font-medium">{record.childName}</div>
            {record.allergies && (
              <div className="text-xs text-red-600">
                <span className="font-medium">Allergies:</span> {record.allergies}
              </div>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "className" as keyof AttendanceRecord,
      header: "Class",
      render: (value: string | undefined) => (
        <div className="flex items-center">
          {value ? (
            <>
              <School className="h-4 w-4 text-purple-600 mr-1" />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-gray-400">No class assigned</span>
          )}
        </div>
      ),
    },
    {
      key: "checkedInAt" as keyof AttendanceRecord,
      header: "Check-in Time",
      render: (value: string) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-green-600 mr-1" />
          <span>{format(parseISO(value), "h:mm a")}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "checkedOutAt" as keyof AttendanceRecord,
      header: "Check-out Time",
      render: (value: string | undefined) => (
        value ? (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-amber-600 mr-1" />
            <span>{format(parseISO(value), "h:mm a")}</span>
          </div>
        ) : (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Present
          </Badge>
        )
      ),
      sortable: true,
    },
    {
      key: "elapsedTime" as keyof AttendanceRecord,
      header: "Time Elapsed",
      render: (value: string, record: AttendanceRecord) => {
        const checkedInTime = new Date(record.checkedInAt).getTime();
        const checkOutTime = record.checkedOutAt 
          ? new Date(record.checkedOutAt).getTime()
          : new Date().getTime();
        
        const diffMs = checkOutTime - checkedInTime;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return (
          <div>
            {diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`}
          </div>
        );
      },
    },
    {
      key: "status" as keyof AttendanceRecord,
      header: "Status",
      render: (value: any, record: AttendanceRecord) => (
        record.checkedOutAt ? (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            Checked Out
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Present
          </Badge>
        )
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, record: AttendanceRecord) => (
        <div className="flex justify-end space-x-2">
          {!record.checkedOutAt && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCheckoutClick(record)}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Check Out
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Check-in/Check-out Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refreshData()}
          >
            <RefreshCcw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                {stat.icon}
                <CardTitle className="ml-2 text-sm font-medium">{stat.title}</CardTitle>
              </div>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View and manage today's check-ins and check-outs
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search by child name or class..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Tabs defaultValue="present" value={activeTab} onValueChange={(v) => setActiveTab(v as "present" | "all")} className="mt-4">
            <TabsList>
              <TabsTrigger value="present">Currently Present</TabsTrigger>
              <TabsTrigger value="all">All Records</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading attendance records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? "No records match your search criteria." 
                  : activeTab === "present" 
                    ? "There are no children currently present." 
                    : "No attendance records for today yet."}
              </p>
            </div>
          ) : (
            <DataTable
              columns={attendanceColumns}
              data={filteredRecords}
              keyExtractor={(item) => item.id}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out {selectedRecord?.childName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckout}>
              {checkoutMutation.isPending ? "Processing..." : "Check Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default CheckInOutManagement;
