import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ClassTeacher } from "@/types/supabase";
import {
  Search,
  Book,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Users,
  LayoutDashboard,
  User,
  CalendarClock,
  Download,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClassItem {
  id: string;
  name: string;
  description: string;
  ageRange: string;
  capacity: number;
  room: string;
  teacherCount: number;
  studentCount: number;
  teachers: { 
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
  }[];
  status?: string;
}

const ClassesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("classes")
          .select("*")
          .order("name");

        if (error) throw error;
        
        const { data: teachersData, error: teachersError } = await supabase
          .from("teachers")
          .select(`
            id,
            class_id,
            user_id,
            profiles:user_id (
              first_name,
              last_name
            )
          `);
          
        if (teachersError) throw teachersError;
        
        const studentCounts = await Promise.all(
          data.map(async (classItem) => {
            const { count, error } = await supabase
              .from("attendance")
              .select("*", { count: 'exact' })
              .eq('class_id', classItem.id)
              .is('checked_out_at', null);
              
            return { class_id: classItem.id, count: count || 0 };
          })
        );
        
        return data.map((item): ClassItem => {
          const classTeachers = teachersData?.filter(teacher => teacher.class_id === item.id) || [];
          const studentCount = studentCounts?.find(count => count.class_id === item.id)?.count || 0;
          
          const teachersList = classTeachers
            .filter(teacher => teacher && typeof teacher === 'object')
            .map(teacher => {
              const profileData = teacher.profiles || null;
              
              let firstName = '';
              let lastName = '';
              
              if (profileData !== null && typeof profileData === 'object') {
                if ('first_name' in profileData && profileData.first_name !== null) {
                  firstName = String(profileData.first_name || '');
                }
                
                if ('last_name' in profileData && profileData.last_name !== null) {
                  lastName = String(profileData.last_name || '');
                }
              }
              
              return {
                id: teacher.id,
                userId: teacher.user_id,
                firstName,
                lastName
              };
            });
          
          return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            ageRange: item.age_range || '',
            capacity: item.capacity || 0,
            room: item.room || '',
            teacherCount: teachersList.length,
            studentCount: Number(studentCount) || 0,
            teachers: teachersList,
          };
        });
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
    enabled: !!user,
  });

  const addClassMutation = useMutation({
    mutationFn: async (newClass: Omit<ClassItem, "id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            name: newClass.name,
            description: newClass.description,
            age_range: newClass.ageRange,
            capacity: newClass.capacity,
            room: newClass.room,
          },
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create class: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async (updatedClass: ClassItem) => {
      const { data, error } = await supabase
        .from("classes")
        .update({
          name: updatedClass.name,
          description: updatedClass.description,
          age_range: updatedClass.ageRange,
          capacity: updatedClass.capacity,
          room: updatedClass.room,
        })
        .eq("id", updatedClass.id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsEditDialogOpen(false);
      setSelectedClass(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update class: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete class: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const filteredClasses = classes.filter((classItem) =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classItem.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    classItem.ageRange.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClass = async (newClass: Omit<ClassItem, "id">) => {
    await addClassMutation.mutateAsync(newClass);
  };

  const handleUpdateClass = async (updatedClass: ClassItem) => {
    await updateClassMutation.mutateAsync(updatedClass);
  };

  const handleDeleteClass = async (id: string) => {
    await deleteClassMutation.mutateAsync(id);
  };

  const classColumns = [
    {
      key: "name" as keyof ClassItem,
      header: "Class Details",
      render: (value: string, classItem: ClassItem) => (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Book className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{classItem.name}</div>
            <div className="text-xs text-gray-500">{classItem.description}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "ageRange" as keyof ClassItem,
      header: "Age Range",
      render: (value: string) => <div>{value}</div>,
      sortable: true,
    },
    {
      key: "capacity" as keyof ClassItem,
      header: "Capacity",
      render: (value: number) => <div>{value}</div>,
    },
    {
      key: "room" as keyof ClassItem,
      header: "Room",
      render: (value: string) => <div>{value}</div>,
    },
    {
      key: "teacherCount" as keyof ClassItem,
      header: "Teachers",
      render: (value: number, classItem: ClassItem) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-purple-600 mr-1" />
          <span>{classItem.teachers.length}</span>
        </div>
      ),
    },
    {
      key: "studentCount" as keyof ClassItem,
      header: "Students",
      render: (value: number) => <div>{value}</div>,
    },
    {
      key: "status" as keyof ClassItem,
      header: "Status",
      render: (value: any) => (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Active
        </Badge>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, classItem: ClassItem) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClass(classItem);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClass(classItem);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
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
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Class
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Classes</CardTitle>
              <CardDescription>
                Manage classes, assign teachers, and view student enrollment
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
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading classes...</span>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <Book className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "No classes match your search criteria."
                  : "Get started by adding your first class."}
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Class
                </Button>
              </div>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Create a new class for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Input
                placeholder="Class Name"
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, name: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Description"
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, description: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Age Range"
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, ageRange: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Capacity"
                type="number"
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, capacity: parseInt(e.target.value) });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Room"
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, room: e.target.value });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                if (selectedClass) {
                  handleAddClass({
                    name: selectedClass.name,
                    description: selectedClass.description,
                    ageRange: selectedClass.ageRange,
                    capacity: selectedClass.capacity,
                    room: selectedClass.room,
                    teacherCount: selectedClass.teacherCount,
                    studentCount: selectedClass.studentCount,
                    teachers: selectedClass.teachers,
                  });
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Make changes to the selected class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Input
                placeholder="Class Name"
                value={selectedClass?.name}
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, name: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Description"
                value={selectedClass?.description}
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, description: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Age Range"
                value={selectedClass?.ageRange}
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, ageRange: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Capacity"
                type="number"
                value={String(selectedClass?.capacity)}
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, capacity: parseInt(e.target.value) });
                  }
                }}
              />
            </div>
            <div>
              <Input
                placeholder="Room"
                value={selectedClass?.room}
                onChange={(e) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, room: e.target.value });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                if (selectedClass) {
                  handleUpdateClass(selectedClass);
                }
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              class "{selectedClass?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedClass) {
                  handleDeleteClass(selectedClass.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ClassesManagement;
