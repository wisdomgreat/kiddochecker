
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpcomingEventsList from "@/components/dashboard/UpcomingEventsList";
import ChildrenManagement from "@/components/children/ChildrenManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Clock, CalendarCheck, Users, CheckCircle, History, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the interface for class data to fix type errors
interface ClassInfo {
  id?: string;
  name: string;
  description: string;
  age_range?: string;
  room?: string;
}

interface ChildClassData {
  childName: string;
  childId: string;
  class: ClassInfo;
}

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState("children");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Get children IDs for parent
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id')
          .eq('parent_id', user.id);
          
        if (childrenError) throw childrenError;
        
        if (!children || children.length === 0) return [];
        
        const childIds = children.map(child => child.id);
        
        // Get attendance records for children
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            checked_out_at,
            attendance_date,
            children(first_name, last_name),
            classes(name)
          `)
          .in('child_id', childIds)
          .order('attendance_date', { ascending: false })
          .limit(20);
          
        if (attendanceError) throw attendanceError;
        
        return attendance || [];
      } catch (error) {
        console.error("Error fetching attendance:", error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Fetch class information
  const { data: classesData, isLoading: classesLoading } = useQuery<ChildClassData[]>({
    queryKey: ["classes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Get children IDs for parent
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id, first_name, last_name')
          .eq('parent_id', user.id);
          
        if (childrenError) throw childrenError;
        
        if (!children || children.length === 0) return [];
        
        // Get unique class assignments for each child
        const childClassData = await Promise.all(children.map(async (child) => {
          // Get the most recent attendance record for each child to find their class
          const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select(`
              classes(id, name, description, age_range, room)
            `)
            .eq('child_id', child.id)
            .order('attendance_date', { ascending: false })
            .limit(1);
            
          if (attendanceError) throw attendanceError;
          
          const classInfo = attendance && attendance.length > 0 ? attendance[0].classes : null;
          
          return {
            childName: `${child.first_name} ${child.last_name}`,
            childId: child.id,
            class: classInfo || { name: 'Not assigned', description: 'No class assignment found' }
          };
        }));
        
        return childClassData;
      } catch (error) {
        console.error("Error fetching class information:", error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  const handleCheckIn = () => {
    navigate("/check-in-process");
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCheckIn}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            Check-in
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("attendance")}>
            <Clock className="mr-2 h-4 w-4" />
            View History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="children" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Children
              </TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="children">
                <ChildrenManagement />
              </TabsContent>
              
              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendanceLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                        <span className="ml-3">Loading attendance data...</span>
                      </div>
                    ) : !attendanceData || attendanceData.length === 0 ? (
                      <div className="text-center py-6">
                        <History className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <h3 className="font-medium text-gray-900">No attendance records</h3>
                        <p className="text-gray-500 mt-1">No check-in/out records found for your children.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Date</th>
                              <th className="text-left py-2 px-3">Child</th>
                              <th className="text-left py-2 px-3">Class</th>
                              <th className="text-left py-2 px-3">Check-In</th>
                              <th className="text-left py-2 px-3">Check-Out</th>
                              <th className="text-left py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.map((record: any) => (
                              <tr key={record.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-3">{formatDate(record.attendance_date)}</td>
                                <td className="py-2 px-3">
                                  {record.children ? `${record.children.first_name} ${record.children.last_name}` : 'N/A'}
                                </td>
                                <td className="py-2 px-3">{record.classes?.name || 'N/A'}</td>
                                <td className="py-2 px-3">{formatTime(record.checked_in_at)}</td>
                                <td className="py-2 px-3">{formatTime(record.checked_out_at)}</td>
                                <td className="py-2 px-3">
                                  {record.checked_out_at ? (
                                    <div className="flex items-center text-green-600">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      <span>Completed</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-blue-600">
                                      <Info className="h-4 w-4 mr-1" />
                                      <span>Checked In</span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="classes">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classesLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                        <span className="ml-3">Loading class information...</span>
                      </div>
                    ) : !classesData || classesData.length === 0 ? (
                      <div className="text-center py-6">
                        <Users className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <h3 className="font-medium text-gray-900">No class assignments</h3>
                        <p className="text-gray-500 mt-1">Your children are not currently assigned to any classes.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {classesData.map((item, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{item.childName}</h3>
                                <h4 className="text-lg font-bold mt-1">{item.class.name}</h4>
                                
                                {item.class.description && (
                                  <p className="text-gray-600 mt-2">{item.class.description}</p>
                                )}
                                
                                <div className="mt-2 space-y-1">
                                  {item.class.age_range && (
                                    <div className="text-sm">
                                      <span className="font-medium">Age Range:</span> {item.class.age_range}
                                    </div>
                                  )}
                                  
                                  {item.class.room && (
                                    <div className="text-sm">
                                      <span className="font-medium">Room:</span> {item.class.room}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {item.class.name === 'Not assigned' && (
                                <div className="flex items-center text-amber-600">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">Not assigned</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <div>
          <UpcomingEventsList />
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
