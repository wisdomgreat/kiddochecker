import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// TypeScript interfaces for type safety
export interface DashboardStats {
  checkedIn: number;
  checkedOut: number;
  totalChildren: number;
  classes: number;
  alerts: number;
}

export interface ClassStatus {
  id: string;
  name: string;
  room: string;
  capacity: number;
  checkedIn: number;
  checkedOut: number;
  remaining: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  date: string;
  user: string;
  details: {
    childId: string;
    className: string;
  };
}

export const useDashboardStats = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Optimized: Use count queries instead of fetching all data
        const { count: checkedIn, error: checkedInError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .is('checked_out_at', null)
          .eq('attendance_date', today);
          
        if (checkedInError) throw checkedInError;
        
        const { count: checkedOut, error: checkedOutError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .not('checked_out_at', 'is', null)
          .eq('attendance_date', today);
          
        if (checkedOutError) throw checkedOutError;
        
        const { count: totalChildren, error: childrenError } = await supabase
          .from('children')
          .select('*', { count: 'exact', head: true });
          
        if (childrenError) throw childrenError;
        
        const { count: classes, error: classesError } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });
          
        if (classesError) throw classesError;
        
        // Future: integrate with alerts system
        const alerts = 0;
        
        return {
          checkedIn: checkedIn || 0,
          checkedOut: checkedOut || 0,
          totalChildren: totalChildren || 0,
          classes: classes || 0,
          alerts,
        };
      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        toast({
          title: "Error Loading Stats",
          description: error.message || "Failed to load dashboard statistics",
          variant: "destructive",
        });
        // Return fallback data
        return {
          checkedIn: 0,
          checkedOut: 0,
          totalChildren: 0,
          classes: 0,
          alerts: 0,
        };
      }
    },
    enabled: !!user, // Only run when user is authenticated
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useClassStatus = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useQuery<ClassStatus[]>({
    queryKey: ["class-status", user?.id],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get all classes first
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id, name, room, capacity');
          
        if (classesError) throw classesError;
        
        // Get today's attendance data
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('class_id, checked_in_at, checked_out_at')
          .eq('attendance_date', today);
          
        if (attendanceError) throw attendanceError;
        
        // Combine data efficiently
        return (classes || []).map((classItem) => {
          const classAttendance = (attendance || []).filter(a => a.class_id === classItem.id);
          const checkedIn = classAttendance.filter(a => a.checked_in_at && !a.checked_out_at).length;
          const checkedOut = classAttendance.filter(a => a.checked_out_at).length;
          
          return {
            id: classItem.id,
            name: classItem.name,
            room: classItem.room || "No room assigned",
            capacity: classItem.capacity || 0,
            checkedIn,
            checkedOut,
            remaining: Math.max(0, (classItem.capacity || 0) - checkedIn),
          };
        });
      } catch (error: any) {
        console.error("Error fetching class status:", error);
        toast({
          title: "Error Loading Classes",
          description: error.message || "Failed to load class status information",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user, // Only run when user is authenticated
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useRecentActivity = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useQuery<RecentActivity[]>({
    queryKey: ["recent-activity", user?.id],
    queryFn: async () => {
      try {
        // Get recent attendance records with related data
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            checked_out_at,
            attendance_date,
            child_id,
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
          const childName = item.children 
            ? `${item.children.first_name} ${item.children.last_name}` 
            : "Unknown Child";
          const className = item.classes?.name || "Unknown Class";
          
          return {
            id: item.id,
            action,
            description: `${childName} was ${action} ${action === "checked-in" ? "to" : "from"} ${className}`,
            timestamp: item.checked_out_at || item.checked_in_at,
            date: item.attendance_date,
            user: childName,
            details: {
              childId: item.child_id,
              className,
            },
          };
        });
      } catch (error: any) {
        console.error("Error fetching recent activity:", error);
        toast({
          title: "Error Loading Activity",
          description: error.message || "Failed to load recent activity",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user, // Only run when user is authenticated
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useRealtimeUpdates = () => {
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [hasClassChanges, setHasClassChanges] = useState(false);
  
  useEffect(() => {
    // Subscribe to attendance changes
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance' 
      }, () => {
        setHasNewActivity(true);
      })
      .subscribe();
      
    // Subscribe to class changes  
    const classesChannel = supabase
      .channel('classes-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classes' 
      }, () => {
        setHasClassChanges(true);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(classesChannel);
    };
  }, []);
  
  const resetFlags = () => {
    setHasNewActivity(false);
    setHasClassChanges(false);
  };
  
  return { hasNewActivity, hasClassChanges, resetFlags };
};


