
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassOption {
  id: string;
  name: string;
  age_range: string | null;
  capacity: number | null;
  room: string | null;
  description: string | null;
  currentAttendance?: number;
}

interface ClassSelectionFormProps {
  childId: string;
  childAge: number;
  onClassSelected: (classId: string, className: string) => void;
  selectedClassId?: string;
}

export const ClassSelectionForm = ({
  childId,
  childAge,
  onClassSelected,
  selectedClassId,
}: ClassSelectionFormProps) => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        
        // Get classes from database
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*');
          
        if (classesError) throw classesError;
        
        // Get current attendance counts for each class
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('class_id, count(*)')
          .eq('attendance_date', today)
          .is('checked_out_at', null)
          .or(`class_id.eq.${classesData.map(c => c.id).join(',class_id.eq.')}`)
          .then(result => {
            // Transform the result to match the expected format
            return {
              ...result,
              data: result.data ? result.data.map(item => ({
                class_id: item.class_id,
                count: item.count
              })) : []
            };
          });
          
        if (attendanceError) throw attendanceError;
        
        // Map attendance counts to classes
        const classesWithAttendance = classesData.map(classItem => {
          const attendanceRecord = attendanceData.find(a => a.class_id === classItem.id);
          return {
            ...classItem,
            currentAttendance: attendanceRecord ? parseInt(attendanceRecord.count) : 0
          };
        });
        
        setClasses(classesWithAttendance);
      } catch (error: any) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Failed to load classes",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [toast]);

  // Filter classes by age appropriateness
  const getAppropriateClasses = () => {
    return classes.filter(classItem => {
      if (!classItem.age_range) return true;
      
      try {
        const [minAge, maxAge] = classItem.age_range.split('-').map(Number);
        return childAge >= minAge && childAge <= maxAge;
      } catch {
        return true; // If age range is improperly formatted, include the class
      }
    });
  };

  const appropriateClasses = getAppropriateClasses();
  const otherClasses = classes.filter(c => !appropriateClasses.includes(c));

  // Function to check if a class is at capacity
  const isAtCapacity = (classItem: ClassOption) => {
    if (!classItem.capacity) return false;
    return (classItem.currentAttendance || 0) >= classItem.capacity;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Select a Class</h3>
      
      {appropriateClasses.length === 0 ? (
        <p className="text-sm text-gray-500">No age-appropriate classes found.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500">Age-appropriate classes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appropriateClasses.map((classItem) => (
              <Card 
                key={classItem.id} 
                className={`cursor-pointer transition-colors ${
                  selectedClassId === classItem.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : isAtCapacity(classItem)
                    ? 'border-red-200 bg-red-50 opacity-60'
                    : 'hover:border-blue-200'
                }`}
                onClick={() => {
                  if (!isAtCapacity(classItem)) {
                    onClassSelected(classItem.id, classItem.name);
                  } else {
                    toast({
                      title: "Class at capacity",
                      description: `${classItem.name} is full. Please select another class.`,
                      variant: "destructive",
                    });
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{classItem.name}</h4>
                      {classItem.age_range && (
                        <p className="text-sm text-gray-500">Ages: {classItem.age_range}</p>
                      )}
                      {classItem.room && (
                        <p className="text-sm text-gray-500">Room: {classItem.room}</p>
                      )}
                      <div className="mt-1 flex items-center text-sm">
                        <Users className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <span className="text-gray-500">
                          {classItem.currentAttendance || 0}
                          {classItem.capacity ? ` / ${classItem.capacity}` : ''}
                        </span>
                      </div>
                    </div>
                    
                    {selectedClassId === classItem.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {otherClasses.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mt-4">Other available classes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherClasses.map((classItem) => (
              <Card 
                key={classItem.id} 
                className={`cursor-pointer transition-colors ${
                  selectedClassId === classItem.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : isAtCapacity(classItem)
                    ? 'border-red-200 bg-red-50 opacity-60'
                    : 'hover:border-blue-200'
                }`}
                onClick={() => {
                  if (!isAtCapacity(classItem)) {
                    onClassSelected(classItem.id, classItem.name);
                  } else {
                    toast({
                      title: "Class at capacity",
                      description: `${classItem.name} is full. Please select another class.`,
                      variant: "destructive",
                    });
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{classItem.name}</h4>
                      {classItem.age_range && (
                        <p className="text-sm text-gray-500">Ages: {classItem.age_range}</p>
                      )}
                      {classItem.room && (
                        <p className="text-sm text-gray-500">Room: {classItem.room}</p>
                      )}
                      <div className="mt-1 flex items-center text-sm">
                        <Users className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <span className="text-gray-500">
                          {classItem.currentAttendance || 0}
                          {classItem.capacity ? ` / ${classItem.capacity}` : ''}
                        </span>
                      </div>
                    </div>
                    
                    {selectedClassId === classItem.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassSelectionForm;
