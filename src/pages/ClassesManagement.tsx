
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddClassForm from "@/components/classes/AddClassForm";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  School,
  Plus,
  Users,
  Info,
  MapPin,
  Edit,
  RefreshCcw,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  ageRange: string | null;
  capacity: number | null;
  room: string | null;
  teacherCount: number;
  studentCount: number;
}

const ClassesManagement = () => {
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, user } = useAuth();

  // Determine if user can add/edit classes
  const canManageClasses = ["admin", "super_admin"].includes(userRole || "");

  // Fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("classes")
          .select(`
            id,
            name,
            description,
            age_range,
            capacity,
            room,
            teachers:teachers(id)
          `);

        if (error) throw error;

        // Process the data and include counts for teachers and students
        return data.map((classItem) => ({
          id: classItem.id,
          name: classItem.name,
          description: classItem.description,
          ageRange: classItem.age_range,
          capacity: classItem.capacity,
          room: classItem.room,
          teacherCount: Array.isArray(classItem.teachers) ? classItem.teachers.length : 0,
          studentCount: 0, // We'll implement this later by querying attendance
        }));
      } catch (error: any) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user, // Only run query when user is authenticated
  });

  // Filter classes based on search term
  const filteredClasses = classes.filter((classItem) => {
    return (
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (classItem.room?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (classItem.ageRange?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  });

  const handleEditClass = (classItem: ClassItem) => {
    // Placeholder for edit functionality
    toast({
      title: "Coming Soon",
      description: "Edit class functionality will be available soon",
    });
  };

  const classColumns = [
    {
      key: "name" as const,
      header: "Class Name",
      render: (value: string, classItem: ClassItem) => (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <School className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{classItem.name}</div>
            {classItem.ageRange && (
              <div className="text-xs text-gray-500">Ages: {classItem.ageRange}</div>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "description" as const,
      header: "Details",
      render: (value: string | null, classItem: ClassItem) => (
        <div className="space-y-1">
          {classItem.description && (
            <div className="text-sm line-clamp-2">
              <Info className="inline h-3 w-3 text-gray-400 mr-1" />
              {classItem.description}
            </div>
          )}
          {classItem.room && (
            <div className="text-xs text-gray-600">
              <MapPin className="inline h-3 w-3 text-gray-400 mr-1" />
              Room: {classItem.room}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "capacity" as const,
      header: "Capacity",
      render: (value: number | null, classItem: ClassItem) => (
        <div>
          {classItem.capacity ? (
            <div className="flex items-center">
              <Users className="h-4 w-4 text-gray-400 mr-1" />
              <span>
                {classItem.studentCount}/{classItem.capacity}
              </span>
            </div>
          ) : (
            <span className="text-gray-500">No limit</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "studentCount" as const,
      header: "Status",
      render: (value: any, classItem: ClassItem) => {
        // Determine class status based on capacity
        const isFull = classItem.capacity !== null && classItem.studentCount >= classItem.capacity;
        const isNearCapacity = classItem.capacity !== null && classItem.studentCount >= classItem.capacity * 0.8;
        
        return (
          <div>
            {isFull ? (
              <Badge variant="destructive">Full</Badge>
            ) : isNearCapacity ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Almost Full</Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, classItem: ClassItem) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!canManageClasses}
            onClick={() => handleEditClass(classItem)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes Management</h1>
        <div className="flex space-x-2">
          {canManageClasses && (
            <Button onClick={() => setIsAddClassOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Class
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Classes</CardTitle>
              <CardDescription>
                Manage your organization's classes and assign teachers.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search classes..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-blue-600 mr-2" />
              <span>Loading classes...</span>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <School className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? "No classes match your search criteria." 
                  : "Get started by creating your first class."}
              </p>
              {canManageClasses && (
                <div className="mt-6">
                  <Button onClick={() => setIsAddClassOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Class
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DataTable
              columns={classColumns}
              data={filteredClasses}
              keyExtractor={(item) => item.id}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Class Dialog */}
      <AddClassForm 
        open={isAddClassOpen} 
        onOpenChange={setIsAddClassOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["classes"] })}
      />
    </MainLayout>
  );
};

export default ClassesManagement;
