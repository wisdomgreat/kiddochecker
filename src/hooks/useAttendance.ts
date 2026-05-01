import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { AttendanceRecord } from "@/types/attendance";
import { AttendanceService } from "@/services/attendanceService";
import { useAuth } from "@/hooks/useAuth";

export const useAttendance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
    mutationFn: async ({ childId, classId, guardianId }: { childId: string; classId?: string; guardianId?: string }) => {
      const result = await AttendanceService.checkInChild({
        childId,
        classId,
        guardianId,
        method: 'dashboard_manual',
        station: 'Dashboard',
        deviceId: user?.user_metadata?.device_id
      });

      if (!result.success) throw new Error(result.error);
      return result.data;
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
    mutationFn: async ({ attendanceId, reason, witnessId }: { attendanceId: string, reason?: string, witnessId?: string }) => {
      const result = await AttendanceService.checkOutChild({
        attendanceId,
        checkedOutBy: user?.id,
        method: 'dashboard_manual',
        station: 'Dashboard',
        overrideReason: reason,
        witnessId: witnessId,
        deviceId: user?.user_metadata?.device_id
      } as any);

      if (!result.success) throw new Error(result.error);
      return result.data;
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

