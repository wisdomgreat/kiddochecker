
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useDashboardStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
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
          checkedIn: attendanceData?.length || 0,
          totalChildren: childrenData?.length || 0,
          classes: classesData?.length || 0,
          checkedOut: 0, // Will be calculated separately if needed
          alerts: 0 // Placeholder for future alert system
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          checkedIn: 0,
          totalChildren: 0,
          classes: 0,
          checkedOut: 0,
          alerts: 0
        };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useClassStatus = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["class-status", user?.id],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get classes with their current attendance counts
        const { data, error } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            room,
            capacity
          `);
          
        if (error) throw error;
        
        // For each class, get attendance counts
        const classesWithAttendance = await Promise.all(
          (data || []).map(async (classItem) => {
            const { data: attendanceData } = await supabase
              .from('attendance')
              .select('id, checked_in_at, checked_out_at')
              .eq('class_id', classItem.id)
              .eq('attendance_date', today);
            
            const checkedIn = (attendanceData || []).filter(a => a.checked_in_at && !a.checked_out_at).length;
            const checkedOut = (attendanceData || []).filter(a => a.checked_out_at).length;
            
            return {
              id: classItem.id,
              name: classItem.name,
              room: classItem.room || "No room assigned",
              capacity: classItem.capacity || 0,
              checkedIn,
              checkedOut,
              remaining: Math.max(0, (classItem.capacity || 0) - checkedIn),
            };
          })
        );
        
        return classesWithAttendance;
      } catch (error) {
        console.error("Error fetching class status:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useRecentActivity = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: async () => {
      try {
        // Get recent attendance records
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            checked_out_at,
            attendance_date,
            children:child_id(
              first_name,
              last_name
            ),
            classes:class_id(
              name
            )
          `)
          .order('checked_in_at', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        // Transform to activity format
        return (data || []).map((item: any) => {
          const action = item.checked_out_at ? "checked-out" : "checked-in";
          const childName = item.children ? `${item.children.first_name} ${item.children.last_name}` : "Unknown Child";
          const className = item.classes ? item.classes.name : "Unknown Class";
          
          return {
            id: item.id,
            action,
            description: `${childName} was ${action} of ${className}`,
            timestamp: item.checked_out_at || item.checked_in_at,
            date: item.attendance_date,
            user: childName,
            details: {
              childId: item.child_id,
              className,
            },
          };
        });
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
};
