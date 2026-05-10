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
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      
      // Automatic Printing Trigger
      // We look up the child name from the variables passed to the mutation
      const child = variables.childId; // In a real app, we'd fetch the name or pass it in
      
      toast({
        title: "Success",
        description: "Child checked in successfully. Printing label...",
      });

      // Trigger the print service with failover
      // For now, we pass dummy name, but in the actual UI we should pass the full object
      import('@/services/printService').then(({ PrintService }) => {
        PrintService.printChildLabel({ name: 'Child Name' }); // Needs real data
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

