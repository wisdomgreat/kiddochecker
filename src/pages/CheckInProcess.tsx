
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, CheckCircle } from "lucide-react";

interface CheckInProcessParams extends Record<string, string> {
  childId: string;
}

const CheckInProcess = () => {
  const { childId } = useParams<CheckInProcessParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [child, setChild] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    age?: number;
    allergies?: string;
  } | null>(null);
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!childId) return;
      
      try {
        // Fetch child data
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('id, first_name, last_name, age, allergies')
          .eq('id', childId)
          .single();

        if (childError) throw childError;
        setChild(childData);

        // Fetch available classes
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .order('name');

        if (classError) throw classError;
        setClasses(classData || []);

        // Auto-select first class if only one available
        if (classData && classData.length === 1) {
          setSelectedClass(classData[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load check-in data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [childId, toast]);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!child || !selectedClass) throw new Error("Missing required data");

      const { error } = await supabase
        .from('attendance')
        .insert({
          child_id: child.id,
          class_id: selectedClass.id,
          attendance_date: new Date().toISOString().split('T')[0],
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${child?.first_name} has been checked in successfully!`,
      });
      navigate('/checkin');
    },
    onError: (error: any) => {
      console.error("Check-in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in child",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Child not found</p>
            <Button onClick={() => navigate('/checkin')} className="mt-4">
              Back to Check-in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Check-in: {child.first_name} {child.last_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">{child.age || 'Not specified'}</p>
            </div>
            {child.allergies && (
              <div>
                <p className="text-sm text-muted-foreground">Allergies</p>
                <Badge variant="destructive">{child.allergies}</Badge>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Select Class</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {classes.map((classItem) => (
                <Button
                  key={classItem.id}
                  variant={selectedClass?.id === classItem.id ? "default" : "outline"}
                  onClick={() => setSelectedClass(classItem)}
                  className="justify-start"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {classItem.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate('/checkin')}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={!selectedClass || checkInMutation.isPending}
            >
              {checkInMutation.isPending ? (
                "Checking in..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInProcess;


