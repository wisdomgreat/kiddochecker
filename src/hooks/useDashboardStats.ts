
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalChildren: number;
  checkedInToday: number;
  totalClasses: number;
  activeStaff: number;
  todayAttendance: number;
  weeklyAverage: number;
  monthlyTotal: number;
  recentActivities: Array<{
    id: string;
    action: string;
    user: string;
    time: string;
    details: string;
  }>;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get total children count
        const { count: totalChildren } = await supabase
          .from('children')
          .select('*', { count: 'exact', head: true });

        // Get checked in today count
        const { count: checkedInToday } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('attendance_date', today)
          .is('checked_out_at', null);

        // Get total classes count
        const { count: totalClasses } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        // Get active staff count
        const { count: activeStaff } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['admin', 'teacher', 'teacher_assistant', 'staff']);

        // Get today's total attendance
        const { count: todayAttendance } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('attendance_date', today);

        // Get recent activities (last 10 attendance records)
        const { data: recentAttendanceData } = await supabase
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            checked_out_at,
            children (
              first_name,
              last_name
            ),
            classes (
              name
            )
          `)
          .order('checked_in_at', { ascending: false })
          .limit(10);

        const recentActivities = (recentAttendanceData || []).map((record: any) => ({
          id: record.id,
          action: record.checked_out_at ? 'Check-out' : 'Check-in',
          user: `${record.children?.first_name || ''} ${record.children?.last_name || ''}`.trim() || 'Unknown',
          time: new Date(record.checked_out_at || record.checked_in_at).toLocaleTimeString(),
          details: `${record.classes?.name || 'Unknown Class'}`
        }));

        // Calculate weekly average (simplified - just use today's count for now)
        const weeklyAverage = todayAttendance || 0;
        
        // Calculate monthly total (simplified - use today's count * 30 for demo)
        const monthlyTotal = (todayAttendance || 0) * 30;

        return {
          totalChildren: totalChildren || 0,
          checkedInToday: checkedInToday || 0,
          totalClasses: totalClasses || 0,
          activeStaff: activeStaff || 0,
          todayAttendance: todayAttendance || 0,
          weeklyAverage,
          monthlyTotal,
          recentActivities
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return default values on error
        return {
          totalChildren: 0,
          checkedInToday: 0,
          totalClasses: 0,
          activeStaff: 0,
          todayAttendance: 0,
          weeklyAverage: 0,
          monthlyTotal: 0,
          recentActivities: []
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
