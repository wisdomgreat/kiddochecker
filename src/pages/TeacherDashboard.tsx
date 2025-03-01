
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "@/components/ui/stat-card";
import { Search, Calendar, Users, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

// Types for teacher dashboard
interface AttendanceRecord {
  id: string;
  childName: string;
  status: string;
  time: string;
  class: string;
}

const TeacherDashboard = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teacher's classes
  const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('teachers')
        .select('class_id, classes(id, name, description, capacity)')
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
      
      return data.map(item => item.classes) || [];
    },
    enabled: !!user,
  });
  
  // Fetch today's attendance for teacher's classes
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['teacher-attendance', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get class IDs for this teacher
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('class_id')
        .eq('user_id', user.id);
        
      if (teacherError) {
        console.error("Error fetching teacher classes:", teacherError);
        throw teacherError;
      }
      
      if (!teacherData || teacherData.length === 0) return [];
      
      const classIds = teacherData.map(t => t.class_id);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          children (
            id,
            first_name,
            last_name
          ),
          classes (
            id,
            name
          )
        `)
        .in('class_id', classIds)
        .eq('attendance_date', today);
        
      if (error) {
        console.error("Error fetching attendance:", error);
        throw error;
      }
      
      return data.map(record => ({
        id: record.id,
        childName: `${record.children.first_name} ${record.children.last_name}`,
        status: record.checked_out_at ? "Checked out" : "Checked in",
        time: new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        class: record.classes?.name || "Unknown Class"
      })) || [];
    },
    enabled: !!user,
  });
  
  // Stats calculations
  const totalStudents = attendanceRecords.length;
  const presentStudents = attendanceRecords.filter(record => record.status === "Checked in").length;
  const absentStudents = 0; // This would need to be calculated based on expected students
  
  // Column definitions for attendance records
  const attendanceColumns = [
    {
      key: "childName" as const,
      header: "Child Name",
      render: (value: string) => (
        <div className="flex items-center">
          <div className="rounded-full bg-purple-100 p-1 mr-2">
            <Users size={16} className="text-purple-600" />
          </div>
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "class" as const,
      header: "Class",
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: string) => (
        <div className="flex items-center">
          <div className={`rounded-full ${value === "Checked in" ? "bg-green-100" : "bg-red-100"} p-1 mr-2`}>
            {value === "Checked in" ? (
              <CheckCircle2 size={16} className="text-green-600" />
            ) : (
              <XCircle size={16} className="text-red-600" />
            )}
          </div>
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "time" as const,
      header: "Time",
    },
  ];
  
  // Filter attendance records based on search term
  const filteredAttendance = attendanceRecords.filter(record =>
    record.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Teacher Dashboard" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-800 text-sm font-medium flex items-center">
            <Calendar size={16} className="mr-1" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="TOTAL STUDENTS"
          value={totalStudents.toString()}
          description="Students in your classes"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="PRESENT TODAY"
          value={presentStudents.toString()}
          description="Currently checked in"
          icon={<CheckCircle2 size={24} />}
          className="bg-white"
          trend={{
            value: `${Math.round((presentStudents / (totalStudents || 1)) * 100)}%`,
            direction: "up",
          }}
        />
        
        <StatCard
          title="ABSENT TODAY"
          value={absentStudents.toString()}
          description="Not checked in"
          icon={<XCircle size={24} />}
          className="bg-white"
          trend={{
            value: `${Math.round((absentStudents / (totalStudents || 1)) * 100)}%`,
            direction: "down",
          }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-8">
        <div className="lg:col-span-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Classes</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesLoading ? (
                  <div className="text-center py-4">Loading classes...</div>
                ) : teacherClasses.length > 0 ? (
                  teacherClasses.map((classItem: any) => (
                    <div key={classItem.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-lg">{classItem.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{classItem.description}</p>
                      <div className="flex justify-between text-sm">
                        <span>Capacity: {classItem.capacity || "N/A"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">No classes assigned yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Today's Attendance</h2>
              
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or class"
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <DataTable
              columns={attendanceColumns}
              data={filteredAttendance}
              keyExtractor={(item) => item.id}
              loading={attendanceLoading}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TeacherDashboard;
