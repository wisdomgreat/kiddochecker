
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AttendanceRecord {
  id: string;
  child_id: string;
  class_id?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  attendance_date: string;
  child?: {
    first_name: string;
    last_name: string;
  };
  class?: {
    name: string;
  };
}

export const useAttendance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attendance = [], isLoading, error, refetch } = useQuery({
    queryKey: ["attendance"],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      try {
        // First, get attendance records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .order('checked_in_at', { ascending: false });

        if (attendanceError) {
          console.error("Error fetching attendance:", attendanceError);
          throw attendanceError;
        }

        if (!attendanceData || attendanceData.length === 0) {
          return [];
        }

        // Get child data separately
        const childIds = [...new Set(attendanceData.map(record => record.child_id))];
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('id, first_name, last_name')
          .in('id', childIds);

        if (childError) {
          console.error("Error fetching children for attendance:", childError);
        }

        const childMap = new Map();
        if (childData) {
          childData.forEach(child => {
            childMap.set(child.id, { first_name: child.first_name, last_name: child.last_name });
          });
        }

        // Get class data separately
        const classIds = [...new Set(attendanceData.filter(record => record.class_id).map(record => record.class_id))];
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .in('id', classIds);

        if (classError) {
          console.error("Error fetching classes for attendance:", classError);
        }

        const classMap = new Map();
        if (classData) {
          classData.forEach(cls => {
            classMap.set(cls.id, { name: cls.name });
          });
        }

        // Combine the data
        const combinedData: AttendanceRecord[] = attendanceData.map(record => ({
          ...record,
          child: childMap.get(record.child_id) || undefined,
          class: record.class_id ? classMap.get(record.class_id) || undefined : undefined,
        }));

        return combinedData;
      } catch (error: any) {
        console.error("Error in useAttendance:", error);
        return []; // Return empty array to prevent UI from breaking
      }
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ childId, classId }: { childId: string; classId?: string }) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          child_id: childId,
          class_id: classId,
          attendance_date: new Date().toISOString().split('T')[0],
          checked_in_at: new Date().toISOString(),
          checked_in_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "Success",
        description: "Child checked in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check in child",
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          checked_out_at: new Date().toISOString(),
          checked_out_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', attendanceId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "Success",
        description: "Child checked out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check out child",
        variant: "destructive",
      });
    },
  });

  return {
    attendance,
    isLoading,
    error,
    refetch,
    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  };
};
