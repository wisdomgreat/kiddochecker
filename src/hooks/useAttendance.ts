
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
  special_instructions?: string;
  child?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  class?: {
    id: string;
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
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            *,
            child:children(id, first_name, last_name),
            class:classes(id, name)
          `)
          .order('checked_in_at', { ascending: false });

        if (error) {
          console.error("Error fetching attendance:", error);
          throw error;
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useAttendance:", error);
        return [];
      }
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ childId, classId }: { childId: string; classId?: string }) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          child_id: childId,
          class_id: classId || null,
          checked_in_at: new Date().toISOString(),
          attendance_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

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
      console.error("Error checking in:", error);
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
          checked_out_at: new Date().toISOString()
        })
        .eq('id', attendanceId)
        .select()
        .single();

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
      console.error("Error checking out:", error);
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

export default useAttendance;
