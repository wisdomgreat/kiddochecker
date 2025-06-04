
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
          .select('*')
          .order('checked_in_at', { ascending: false });

        if (error) {
          console.error("Error fetching attendance:", error);
          throw error;
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useAttendance:", error);
        throw new Error(`Failed to load attendance: ${error.message}`);
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
