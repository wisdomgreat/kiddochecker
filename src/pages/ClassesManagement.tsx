
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  Search, 
  Edit, 
  MoreVertical, 
  Users, 
  Calendar, 
  Bell, 
  Plus,
  Filter,
  Download,
  Trash2,
  FileText
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import AddClassForm from "@/components/classes/AddClassForm";
import AssignTeacherForm from "@/components/classes/AssignTeacherForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock data for class roster
const rosterData = [
  { id: "1", name: "Emma Wilson", age: 4, status: "Checked in", time: "9:45 AM", allergies: "None", parentName: "Sarah & James Wilson", parentContact: "555-123-4567" },
  { id: "2", name: "Noah Johnson", age: 5, status: "Checked in", time: "9:48 AM", allergies: "Peanuts", parentName: "Michael Johnson", parentContact: "555-234-5678" },
  { id: "3", name: "Olivia Smith", age: 3, status: "Checked in", time: "9:50 AM", allergies: "None", parentName: "Emily & Daniel Smith", parentContact: "555-345-6789" },
  { id: "4", name: "Liam Brown", age: 4, status: "Checked in", time: "9:55 AM", allergies: "Special needs: Yes", parentName: "Jessica Brown", parentContact: "555-456-7890" },
  { id: "5", name: "Ava Davis", age: 5, status: "Checked out", time: "10:30 AM", allergies: "Gluten", parentName: "Robert Davis", parentContact: "555-567-8901" },
  { id: "6", name: "Ethan Miller", age: 3, status: "Absent", time: "", allergies: "None", parentName: "Jennifer Miller", parentContact: "555-678-9012" },
  { id: "7", name: "Isabella Garcia", age: 4, status: "Checked in", time: "9:42 AM", allergies: "None", parentName: "Maria Garcia", parentContact: "555-789-0123" },
  { id: "8", name: "Mason Rodriguez", age: 5, status: "Checked in", time: "9:58 AM", allergies: "Dairy", parentName: "Carlos Rodriguez", parentContact: "555-890-1234" }
];

// Teacher data for the selected class
const teacherData = [
  { id: "1", name: "Sarah Johnson", role: "Lead Teacher", experience: "5 years", certified: true, contact: "555-111-2222" },
  { id: "2", name: "Michael Chen", role: "Assistant Teacher", experience: "2 years", certified: true, contact: "555-333-4444" }
];

const ClassesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [activeClassTab, setActiveClassTab] = useState("roster");
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch classes
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        return data.map((classItem) => ({
          id: classItem.id,
          name: classItem.name,
          ageGroup: classItem.age_range,
          capacity: `0/${classItem.capacity || "∞"}`,
          room: classItem.room,
          description: classItem.description,
          teachers: "Loading...",
          schedule: "Sunday, 9:30 AM - 11:30 AM", // This would come from a schedule table
          location: classItem.room,
          status: true
        }));
      } catch (error: any) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes",
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  // Fetch teachers for each class
  const { data: teachersData = {}, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["class-teachers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("teachers")
          .select(`
            user_id,
            class_id,
            profiles(first_name, last_name)
          `);
          
        if (error) throw error;
        
        // Organize teachers by class_id
        const teachersByClass: Record<string, string[]> = {};
        data.forEach((teacher) => {
          const classId = teacher.class_id;
          const teacherName = `${teacher.profiles?.first_name || ''} ${teacher.profiles?.last_name || ''}`.trim();
          
          if (classId) {
            if (!teachersByClass[classId]) {
              teachersByClass[classId] = [];
            }
            if (teacherName) {
              teachersByClass[classId].push(teacherName);
            }
          }
        });
        
        return teachersByClass;
      } catch (error: any) {
        console.error("Error fetching teachers:", error);
        return {};
      }
    },
    enabled: classes.length > 0
  });
  
  // Combine classes with their teachers
  const classesWithTeachers = classes.map((classItem) => ({
    ...classItem,
    teachers: teachersData[classItem.id] 
      ? teachersData[classItem.id].join(", ") 
      : "No teachers assigned"
  }));

  // Get teachers for selected class
  const teachersForSelectedClass = selectedClass && teachersData[selectedClass.id] 
    ? teachersData[selectedClass.id].map((name, index) => ({
        id: `teacher-${index}`,
        name,
        role: index === 0 ? "Lead Teacher" : "Assistant Teacher",
        experience: "Not specified",
        certified: true,
        contact: "Not specified"
      }))
    : [];
  
  // Class columns for data table
  const classColumns = [
    {
      key: "name" as const,
      header: "Class Name",
      render: (value: string, item: typeof classes[0]) => (
        <div className="flex items-center">
          <div className="rounded-full bg-purple-100 p-2 mr-3">
            <GraduationCap size={16} className="text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.ageGroup}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "ageGroup" as const,
      header: "Age Group",
      sortable: true,
    },
    {
      key: "capacity" as const,
      header: "Capacity",
      render: (value: string) => (
        <div className="flex items-center">
          <div className={`w-16 h-2 rounded-full bg-gray-200 mr-2 overflow-hidden`}>
            <div
              className={`h-full rounded-full ${
                parseInt(value.split('/')[0]) / parseInt(value.split('/')[1]) > 0.8
                  ? "bg-red-500"
                  : parseInt(value.split('/')[0]) / parseInt(value.split('/')[1]) > 0.5
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${
                  isNaN(parseInt(value.split('/')[1])) 
                    ? 0 
                    : (parseInt(value.split('/')[0]) / parseInt(value.split('/')[1])) * 100
                }%`,
              }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">{value}</span>
        </div>
      ),
    },
    {
      key: "teachers" as const,
      header: "Teachers",
      render: (value: string) => (
        <div className="flex items-center">
          <Users size={16} className="text-gray-400 mr-2" />
          <span className="text-sm">{
            value === "Loading..." 
              ? "Loading..." 
              : value === "No teachers assigned" 
                ? "No teachers assigned" 
                : `${value.split(',')[0]}${value.split(',').length > 1 ? ` +${value.split(',').length - 1}` : ''}`
          }</span>
        </div>
      ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: boolean) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
            {value ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
  ];

  // Roster columns for data table
  const rosterColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Users size={16} className="text-gray-500" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "age" as const,
      header: "Age",
      render: (value: number) => <span>Age {value}</span>,
      sortable: true,
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: string) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === "Checked in" ? "bg-green-100 text-green-800" : 
          value === "Checked out" ? "bg-blue-100 text-blue-800" : 
          "bg-gray-100 text-gray-800"
        }`}>
          {value}
        </span>
      ),
      sortable: true,
    },
    {
      key: "time" as const,
      header: "Time",
    },
    {
      key: "allergies" as const,
      header: "Allergies",
      render: (value: string) => (
        <span className={`text-sm ${value.includes("Special needs") || value.includes("Peanuts") ? "text-red-600 font-medium" : "text-gray-500"}`}>
          {value}
        </span>
      ),
    },
    {
      key: "parentName" as const,
      header: "Parent/Guardian",
    },
  ];

  // Filter classes based on search term
  const filteredClasses = classesWithTeachers.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cls.ageGroup && cls.ageGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
    cls.teachers.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Classes", path: "/classes" },
          { label: "Management" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <Filter size={16} />
            <span>Filter</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download size={16} />
            <span>Export</span>
          </Button>
          <Button className="flex items-center gap-1" onClick={() => setIsAddClassOpen(true)}>
            <Plus size={16} />
            <span>Add New Class</span>
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "active"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active Classes
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "archived"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("archived")}
          >
            Archived Classes
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "templates"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("templates")}
          >
            Class Templates
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {activeTab === "active" && "Active Classes"}
            {activeTab === "archived" && "Archived Classes"}
            {activeTab === "templates" && "Class Templates"}
          </h2>
          
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, age group, or teacher"
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoadingClasses || isLoadingTeachers ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading classes...</span>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap size={48} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No classes found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "No classes match your search criteria." 
                  : "Start by adding your first class."}
              </p>
              <Button onClick={() => setIsAddClassOpen(true)}>
                <Plus size={16} className="mr-1" />
                Add New Class
              </Button>
            </div>
          ) : (
            <DataTable
              columns={classColumns}
              data={filteredClasses}
              keyExtractor={(item) => item.id}
              searchable={false}
              onRowClick={(item) => setSelectedClass(item)}
            />
          )}
        </div>
      </div>
      
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-start mb-6">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <GraduationCap size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedClass.name}</h2>
                    <p className="text-gray-600">
                      {selectedClass.ageGroup} • {selectedClass.location} • {selectedClass.schedule}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-1">
                      <Edit size={16} />
                      <span>Edit</span>
                    </Button>
                    <Button className="flex items-center gap-1">
                      <FileText size={16} />
                      <span>Class Details</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="STUDENTS"
                value={selectedClass.capacity.split('/')[0]}
                description={`of ${selectedClass.capacity.split('/')[1]} max capacity`}
                icon={<Users size={24} />}
                actionLabel="View Students"
              />
              
              <StatCard
                title="TEACHERS"
                value={selectedClass.teachers !== "No teachers assigned" && selectedClass.teachers !== "Loading..." 
                  ? String(selectedClass.teachers.split(',').length)
                  : "0"}
                description="Assigned to class"
                icon={<Users size={24} />}
                onActionClick={() => setIsAssignTeacherOpen(true)}
                actionLabel="Manage Teachers"
              />
              
              <StatCard
                title="SCHEDULE"
                value="Sunday"
                description="9:30 AM - 11:30 AM"
                icon={<Calendar size={24} />}
                actionLabel="Edit Schedule"
              />
              
              <StatCard
                title="ALERTS"
                value="2"
                description="Allergy alerts in class"
                icon={<Bell size={24} />}
                actionLabel="View Details"
              />
            </div>
            
            <div className="border-b border-gray-200 mb-6">
              <div className="flex">
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeClassTab === "roster"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveClassTab("roster")}
                >
                  Class Roster
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeClassTab === "teachers"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveClassTab("teachers")}
                >
                  Teachers
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeClassTab === "materials"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveClassTab("materials")}
                >
                  Materials
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeClassTab === "settings"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveClassTab("settings")}
                >
                  Settings
                </button>
              </div>
            </div>
            
            {activeClassTab === "roster" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Class Roster</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-1 text-sm">
                      <Download size={14} />
                      <span>Export Roster</span>
                    </Button>
                    <Button className="flex items-center gap-1 text-sm">
                      <Plus size={14} />
                      <span>Add Student</span>
                    </Button>
                  </div>
                </div>
                
                <DataTable
                  columns={rosterColumns}
                  data={rosterData}
                  keyExtractor={(item) => item.id}
                  searchable={true}
                  searchPlaceholder="Search students by name, age, or status..."
                />
              </>
            )}
            
            {activeClassTab === "teachers" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Teachers</h3>
                  <Button onClick={() => setIsAssignTeacherOpen(true)} className="flex items-center gap-1 text-sm">
                    <Plus size={14} />
                    <span>Assign Teacher</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {teachersForSelectedClass.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                      <Users size={48} className="mx-auto text-gray-400 mb-2" />
                      <h3 className="font-medium text-gray-900 mb-1">No teachers assigned</h3>
                      <p className="text-gray-500 mb-4">Assign teachers to this class to get started.</p>
                      <Button onClick={() => setIsAssignTeacherOpen(true)} variant="outline" size="sm">
                        <Plus size={14} className="mr-1" />
                        Assign Teacher
                      </Button>
                    </div>
                  ) : (
                    teachersForSelectedClass.map((teacher) => (
                      <div key={teacher.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <Users size={20} className="text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{teacher.name}</h4>
                              <p className="text-sm text-gray-500">{teacher.role} • {teacher.experience}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${teacher.certified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {teacher.certified ? "Certified" : "Not Certified"}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit size={16} />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Contact: {teacher.contact}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            
            {activeClassTab === "materials" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Class Materials</h3>
                  <button className="px-2.5 py-1.5 rounded-md bg-purple-600 text-white flex items-center gap-1 hover:bg-purple-700 text-sm">
                    <Plus size={14} />
                    <span>Add Material</span>
                  </button>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                  <h4 className="text-lg font-medium mb-1">No materials added yet</h4>
                  <p className="text-gray-500 mb-4">Upload lesson plans, activity sheets, or other materials for this class</p>
                  <button className="px-4 py-2 rounded-md bg-purple-600 text-white inline-flex items-center gap-2 hover:bg-purple-700">
                    <Plus size={16} />
                    <span>Add First Material</span>
                  </button>
                </div>
              </div>
            )}
            
            {activeClassTab === "settings" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-4">Class Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      defaultValue={selectedClass.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      defaultValue={selectedClass.ageGroup}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      defaultValue={selectedClass.location}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      defaultValue={parseInt(selectedClass.capacity.split('/')[1]) || ""}
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-2">Class Status</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Active</p>
                      <p className="text-sm text-gray-500">This class is currently active and visible in the system</p>
                    </div>
                    <div className="relative inline-block w-14 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={selectedClass.status}
                      />
                      <div className="block h-8 rounded-full bg-gray-200 w-14"></div>
                      <div className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transform ${selectedClass.status ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-2">Danger Zone</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h5 className="text-red-700 font-medium mb-1">Archive Class</h5>
                    <p className="text-sm text-red-600 mb-3">Archiving will remove this class from active view but preserve all records.</p>
                    <button className="px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                      Archive Class
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
      
      <AddClassForm 
        open={isAddClassOpen} 
        onOpenChange={setIsAddClassOpen} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['classes'] });
          toast({
            title: "Success",
            description: "Class created successfully",
          });
        }}
      />
      
      {selectedClass && (
        <AssignTeacherForm
          open={isAssignTeacherOpen}
          onOpenChange={setIsAssignTeacherOpen}
          classId={selectedClass.id}
          className={selectedClass.name}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            queryClient.invalidateQueries({ queryKey: ['class-teachers'] });
            toast({
              title: "Success",
              description: "Teacher assigned successfully",
            });
          }}
        />
      )}
    </MainLayout>
  );
};

export default ClassesManagement;
