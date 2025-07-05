
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Get checked in count for today
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('id')
          .eq('attendance_date', today)
          .is('checked_out_at', null);

        if (attendanceError) {
          console.error("Error fetching attendance:", attendanceError);
        }

        // Get total children count
        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('id');

        if (childrenError) {
          console.error("Error fetching children:", childrenError);
        }

        // Get total classes count
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id');

        if (classesError) {
          console.error("Error fetching classes:", classesError);
        }

        return {
          checkedInToday: attendanceData?.length || 0,
          totalChildren: childrenData?.length || 0,
          totalClasses: classesData?.length || 0,
          recentActivities: []
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          checkedInToday: 0,
          totalChildren: 0,
          totalClasses: 0,
          recentActivities: []
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
