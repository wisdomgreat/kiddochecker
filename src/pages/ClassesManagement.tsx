
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Users, MapPin } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";
import AddEditClassDialog from "@/components/classes/AddEditClassDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClassWithTeacher {
  id: string;
  name: string;
  description: string;
  age_range: string;
  capacity: number;
  room: string;
  created_at: string;
  teacher_name?: string;
}

const ClassesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithTeacher | null>(null);

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['classes-with-teachers'],
    queryFn: async (): Promise<ClassWithTeacher[]> => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teachers (
            profiles (
              first_name,
              last_name
            )
          )
        `);
      
      if (error) {
        console.error('Error fetching classes:', error);
        throw error;
      }
      
      return (data || []).map(cls => ({
        ...cls,
        teacher_name: cls.teachers?.[0]?.profiles ? 
          `${cls.teachers[0].profiles.first_name} ${cls.teachers[0].profiles.last_name}` : 
          undefined
      }));
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
            <p className="text-gray-600 mt-2">Manage classes and teacher assignments</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes Grid */}
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

        {filteredClasses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No classes found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        <AddEditClassDialog
          open={showAddForm}
          onOpenChange={handleCloseForm}
          classData={selectedClass}
        />
      </div>
    </SimpleLayout>
  );
};

export default ClassesManagement;
