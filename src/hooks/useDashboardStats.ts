
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Mock data for now - in a real app this would come from the database
      return {
        stats: {
          checkedIn: 24,
          checkedOut: 18,
          classes: 8,
          alerts: 2,
        },
        recentActivity: [
          {
            id: "1",
            action: "checked-in",
            description: "Emma Johnson checked into Toddler Class",
            timestamp: new Date().toISOString(),
            date: new Date().toISOString(),
            user: "Sarah Williams",
          },
          {
            id: "2", 
            action: "checked-out",
            description: "Michael Davis checked out of Elementary Class",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            date: new Date().toISOString(),
            user: "John Smith",
          },
        ],
        alerts: [],
        upcomingEvents: [],
        classStatus: [],
      };
    },
    enabled: !!user,
  });
};
