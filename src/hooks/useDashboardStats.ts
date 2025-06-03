
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useDashboardStats = () => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      try {
        console.log("Fetching dashboard stats for user:", user.id);
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch stats with proper error handling
        const [checkedInResult, classesResult] = await Promise.all([
          supabase
            .from('attendance')
            .select('id', { count: 'exact' })
            .is('checked_out_at', null)
            .eq('attendance_date', today),
          supabase
            .from('classes')
            .select('id', { count: 'exact' })
        ]);

        console.log("Dashboard stats results:", { checkedInResult, classesResult });

        // Handle potential errors in individual queries
        if (checkedInResult.error) {
          console.warn("Error fetching checked-in count:", checkedInResult.error);
        }
        if (classesResult.error) {
          console.warn("Error fetching classes count:", classesResult.error);
        }

        const stats = {
          checkedIn: checkedInResult.count || 0,
          checkedOut: 0, // Calculate separately if needed
          classes: classesResult.count || 0,
          alerts: 0, // Placeholder for now
        };

        console.log("Final dashboard stats:", stats);
        return stats;
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
    enabled: !!user && !authLoading,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};
