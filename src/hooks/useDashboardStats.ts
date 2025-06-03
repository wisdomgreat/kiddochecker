
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      try {
        // Get real stats with timeout protection
        const statsPromise = Promise.race([
          (async () => {
            const [checkedInResult, classesResult] = await Promise.all([
              supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .is('checked_out_at', null)
                .eq('attendance_date', new Date().toISOString().split('T')[0]),
              supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
            ]);

            return {
              checkedIn: checkedInResult.count || 0,
              checkedOut: 0, // Will calculate separately if needed
              classes: classesResult.count || 0,
              alerts: 0, // Placeholder for now
            };
          })(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Dashboard stats timeout")), 5000)
          )
        ]);

        return await statsPromise;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return fallback data instead of throwing
        return {
          checkedIn: 0,
          checkedOut: 0,
          classes: 0,
          alerts: 0,
        };
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};
