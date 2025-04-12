
import { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "@/components/ui/stat-card";
import { Users, Calendar, Clock, BarChart, Search, UserPlus, QrCode } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import UpcomingEventsList from "@/components/dashboard/UpcomingEventsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/card";
import QRCode from "qrcode.react";

const ParentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  // Fetch parent's children
  const { data: childrenData = [], isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
        
      if (error) {
        console.error("Error fetching children:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });
  
  // Fetch recent attendance for parent's children
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['parent-attendance', user?.id],
    queryFn: async () => {
      if (!user || childrenData.length === 0) return [];
      
      const childIds = childrenData.map(child => child.id);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          attendance_date,
          checked_in_at,
          checked_out_at,
          child_id,
          children(first_name, last_name),
          classes(name)
        `)
        .in('child_id', childIds)
        .order('attendance_date', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching attendance:", error);
        throw error;
      }
      
      return data.map(record => ({
        id: record.id,
        childName: `${record.children.first_name} ${record.children.last_name}`,
        date: new Date(record.attendance_date).toLocaleDateString(),
        class: record.classes?.name || "Unknown Class",
        checkedIn: record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
        checkedOut: record.checked_out_at ? new Date(record.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not yet"
      })) || [];
    },
    enabled: !!user && childrenData.length > 0,
  });
  
  // Stats calculations
  const totalChildren = childrenData.length;
  const childrenInAttendance = new Set(
    attendanceRecords
      .filter(record => record.date === new Date().toLocaleDateString() && record.checkedOut === "Not yet")
      .map(record => record.childName)
  ).size;
  
  // Column definitions for children
  const childrenColumns = [
    {
      key: "first_name" as const,
      header: "Name",
      render: (value: string, item: any) => (
        <div className="flex items-center">
          <div className="rounded-full bg-blue-100 p-1 mr-2">
            <Users size={16} className="text-blue-600" />
          </div>
          <span>{`${value} ${item.last_name}`}</span>
        </div>
      ),
    },
    {
      key: "age" as const,
      header: "Age",
    },
    {
      key: "allergies" as const,
      header: "Allergies",
      render: (value: string) => value || "None",
    },
    {
      key: "actions" as const,
      header: "",
      render: (_: any, item: any) => (
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-800"
          onClick={() => handleViewChildDetails(item.id)}
        >
          View Details
        </Button>
      ),
    },
  ];
  
  // Column definitions for attendance history
  const attendanceColumns = [
    {
      key: "childName" as const,
      header: "Child",
    },
    {
      key: "date" as const,
      header: "Date",
    },
    {
      key: "class" as const,
      header: "Class",
    },
    {
      key: "checkedIn" as const,
      header: "Check-in Time",
    },
    {
      key: "checkedOut" as const,
      header: "Check-out Time",
      render: (value: string) => (
        <span className={value === "Not yet" ? "text-orange-500 font-medium" : ""}>
          {value}
        </span>
      ),
    },
  ];

  const handleAddChild = () => {
    toast({
      title: "Coming soon",
      description: "The add child functionality will be available soon!",
    });
  };

  const handleViewChildDetails = (childId: string) => {
    toast({
      title: "Child Details",
      description: `Viewing details for child ID: ${childId}`,
    });
    // Implement child details view
  };

  const handleContactSupport = () => {
    toast({
      title: "Support Request Sent",
      description: "A support representative will contact you shortly.",
    });
    // Implement contact support functionality
  };

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Parent Dashboard" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 text-sm font-medium flex items-center">
            <Calendar size={16} className="mr-1" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="YOUR CHILDREN"
          value={totalChildren.toString()}
          description="Total registered children"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="CURRENTLY IN CLASS"
          value={childrenInAttendance.toString()}
          description="Children currently checked in"
          icon={<Clock size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="CLASSES ATTENDED"
          value={attendanceRecords.length.toString()}
          description="Total attendance records"
          icon={<BarChart size={24} />}
          className="bg-white"
        />
        
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogTrigger asChild>
            <div className="bg-purple-50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
              <div>
                <h3 className="font-bold text-purple-900">Check-in QR Code</h3>
                <p className="text-sm text-purple-700">Quick check-in for your children</p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsQrDialogOpen(true)}>
                <QrCode size={16} className="mr-2" /> View Code
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Check-in QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center p-4">
              <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
                <QRCode
                  value={user?.id || "no-user-id"}
                  size={200}
                  level="H"
                  includeMargin={true}
                  renderAs="svg"
                />
              </div>
              <p className="text-center text-gray-600">
                Present this QR code at the check-in kiosk for quick and easy check-in for all your children.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="mb-8">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Children</h2>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddChild}>
                <UserPlus size={16} className="mr-2" /> Add Child
              </Button>
            </div>
            
            {childrenLoading ? (
              <div className="text-center py-4">Loading children data...</div>
            ) : childrenData.length > 0 ? (
              <DataTable
                columns={childrenColumns}
                data={childrenData}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users size={48} className="mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">No Children Added Yet</h3>
                <p className="text-gray-500 mb-4">Add your children to manage their attendance</p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddChild}>
                  <UserPlus size={16} className="mr-2" /> Add Your First Child
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Attendance</h2>
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search attendance records"
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {attendanceLoading ? (
              <div className="text-center py-4">Loading attendance data...</div>
            ) : attendanceRecords.length > 0 ? (
              <DataTable
                columns={attendanceColumns}
                data={attendanceRecords.filter(record => 
                  record.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  record.class.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar size={48} className="mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">No Attendance Records Yet</h3>
                <p className="text-gray-500">Check-in records will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white p-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Need Assistance?</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions or need help with the check-in process, please contact our staff.
            </p>
            <Button variant="outline" onClick={handleContactSupport}>Contact Support</Button>
          </div>
        </Card>
        
        <Card className="bg-white p-6">
          <UpcomingEventsList />
        </Card>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
