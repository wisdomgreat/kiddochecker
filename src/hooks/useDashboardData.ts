
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDashboardStats = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        // Get number of checked in children
        const { count: checkedIn, error: checkedInError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .is('checked_out_at', null)
          .eq('attendance_date', new Date().toISOString().split('T')[0]);
          
        if (checkedInError) throw checkedInError;
        
        // Get number of checked out children
        const { count: checkedOut, error: checkedOutError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .not('checked_out_at', 'is', null)
          .eq('attendance_date', new Date().toISOString().split('T')[0]);
          
        if (checkedOutError) throw checkedOutError;
        
        // Get number of classes
        const { count: classes, error: classesError } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });
          
        if (classesError) throw classesError;
        
        // For now, hardcode alerts to 0 since we don't have an alerts system yet
        const alerts = 0;
        
        return {
          checkedIn: checkedIn || 0,
          checkedOut: checkedOut || 0,
          classes: classes || 0,
          alerts,
        };
      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
        return {
          checkedIn: 0,
          checkedOut: 0,
          classes: 0,
          alerts: 0,
        };
      }
    },
  });
};

export const useClassStatus = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["class-status"],
    queryFn: async () => {
      try {
        // Get classes with their current attendance counts
        const { data, error } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            room,
            capacity,
            attendance!inner(
              id,
              checked_in_at,
              checked_out_at
            )
          `)
          .eq('attendance.attendance_date', new Date().toISOString().split('T')[0]);
          
        if (error) throw error;
        
        // Transform data to get counts
        return (data || []).map((classItem: any) => ({
          id: classItem.id,
          name: classItem.name,
          room: classItem.room || "No room assigned",
          capacity: classItem.capacity || 0,
          checkedIn: classItem.attendance.filter((a: any) => a.checked_in_at).length,
          checkedOut: classItem.attendance.filter((a: any) => a.checked_out_at).length,
          remaining: (classItem.capacity || 0) - classItem.attendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length,
        }));
      } catch (error: any) {
        console.error("Error fetching class status:", error);
        toast({
          title: "Error",
          description: "Failed to load class status information",
          variant: "destructive",
        });
        return [];
      }
    },
  });
};

export const useRecentActivity = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      try {
        // For now, we'll simulate activity data
        // In a real app, this would query an activity_logs table
        
        // Get recent attendance records to use as activity
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
      } catch (error: any) {
        console.error("Error fetching recent activity:", error);
        toast({
          title: "Error",
          description: "Failed to load recent activity",
          variant: "destructive",
        });
        return [];
      }
    },
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
