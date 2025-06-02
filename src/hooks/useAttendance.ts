
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface AttendanceRecord {
  id: string;
  child_id: string;
  class_id?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  attendance_date: string;
  children?: {
    first_name: string;
    last_name: string;
  };
  classes?: {
    name: string;
  };
}

export const useAttendance = (date?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ["attendance", date || new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          children:child_id(first_name, last_name),
          classes:class_id(name)
        `)
        .eq('attendance_date', targetDate)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!user,
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ childId, classId }: { childId: string; classId?: string }) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          child_id: childId,
          class_id: classId,
          checked_in_by: user?.id,
          attendance_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
          checked_out_by: user?.id
        })
        .eq('id', attendanceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
    attendance: attendanceQuery.data || [],
    isLoading: attendanceQuery.isLoading,
    error: attendanceQuery.error,
    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  };
};

export const useAttendanceReports = () => {
  const { toast } = useToast();

  const getDetailedReport = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: startDate,
        end_date: endDate
      });
      
      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  return {
    generateDetailedReport: getDetailedReport.mutate,
    reportData: getDetailedReport.data,
    isGenerating: getDetailedReport.isPending,
  };
};
