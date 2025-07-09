
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Users, MapPin } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";
import AddEditClassDialog from "@/components/classes/AddEditClassDialog";
import ManagementHeader from "@/components/management/ManagementHeader";
import SearchAndFilter from "@/components/management/SearchAndFilter";
import EmptyState from "@/components/management/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithTeacher } from "@/types/classes";

const ClassesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithTeacher | null>(null);

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['classes-with-teachers'],
    queryFn: async (): Promise<ClassWithTeacher[]> => {
      try {
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*');
        
        if (classesError) {
          console.error('Error fetching classes:', classesError);
          throw classesError;
        }

        const { data: teachersData, error: teachersError } = await supabase
          .from('teachers')
          .select(`
            class_id,
            user_id,
            profiles!inner (
              first_name,
              last_name
            )
          `);

        if (teachersError) {
          console.error('Error fetching teachers:', teachersError);
        }

        return (classesData || []).map(cls => {
          const teacher = teachersData?.find(t => t.class_id === cls.id);
          const teacherProfile = teacher?.profiles;
          
          let teacher_name: string | undefined = undefined;
          
          if (teacherProfile && typeof teacherProfile === 'object') {
            const profile = teacherProfile as { first_name?: string; last_name?: string };
            
            if (profile.first_name && profile.last_name) {
              teacher_name = `${profile.first_name} ${profile.last_name}`;
            }
          }
          
          return {
            ...cls,
            teacher_name
          } as ClassWithTeacher;
        });
      } catch (error) {
        console.error('Error in classes query:', error);
        return [];
      }
    },
  });

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.age_range?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.room?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClass = (cls: ClassWithTeacher) => {
    setSelectedClass(cls);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setSelectedClass(null);
    refetch();
  };

  const handleSaveClass = async (classData: any) => {
    try {
      if (selectedClass) {
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', selectedClass.id);
        
        if (error) {
          console.error('Error updating class:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([classData]);
        
        if (error) {
          console.error('Error creating class:', error);
          throw error;
        }
      }
      
      handleCloseForm();
    } catch (error) {
      console.error('Error saving class:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ManagementHeader 
            title="Classes Management"
            description="Manage classes and teacher assignments"
          />
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search classes..."
            />
          </CardContent>
        </Card>

        {filteredClasses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No classes found"
            description="No classes found matching your criteria."
            actionLabel="Add Class"
            onAction={() => setShowAddForm(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <Card 
                key={cls.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEditClass(cls)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      {cls.capacity} max
                    </Badge>
                  </div>
                  {cls.description && (
                    <p className="text-sm text-gray-600">{cls.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {cls.age_range && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Age: {cls.age_range}</span>
                      </div>
                    )}
                    {cls.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Room: {cls.room}</span>
                      </div>
                    )}
                    {cls.teacher_name && (
                      <div className="mt-2">
                        <Badge className="bg-green-100 text-green-800">
                          Teacher: {cls.teacher_name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddEditClassDialog
          isOpen={showAddForm}
          onClose={handleCloseForm}
          onSave={handleSaveClass}
          classItem={selectedClass}
          isLoading={false}
        />
      </div>
    </SimpleLayout>
  );
};

export default ClassesManagement;
