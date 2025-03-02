
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface ActivityRecord {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
}

export interface ClassStatusItem {
  id: string;
  name: string;
  children: number;
  teachers: number;
  active: boolean;
}

export interface DashboardStats {
  checkedIn: number;
  checkedOut: number;
  classes: number;
  alerts: number;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
  });
}

export function useClassStatus() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClassStatus,
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
  });
}

// Add a custom hook for real-time updates
export function useRealtimeUpdates() {
  const { toast } = useToast();
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [hasClassChanges, setHasClassChanges] = useState(false);

  useEffect(() => {
    // Set up real-time subscriptions for attendance changes
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('Attendance change detected:', payload);
          setHasNewActivity(true);
          
          const event = payload.eventType;
          const actionMap = {
            INSERT: 'checked in',
            UPDATE: 'updated',
            DELETE: 'removed'
          };
          
          toast({
            title: `Attendance ${actionMap[event] || 'changed'}`,
            description: "New activity has been recorded",
          });
        }
      )
      .subscribe();

    // Set up real-time subscriptions for class changes
    const classesChannel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('Class change detected:', payload);
          setHasClassChanges(true);
          
          toast({
            title: "Class information updated",
            description: "Class data has been changed",
          });
        }
      )
      .subscribe();

    return () => {
      // Clean up subscriptions
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(classesChannel);
    };
  }, [toast]);

  return { hasNewActivity, hasClassChanges, resetFlags: () => {
    setHasNewActivity(false);
    setHasClassChanges(false);
  }};
}

async function fetchRecentActivity(): Promise<ActivityRecord[]> {
  try {
    const todayDate = new Date().toISOString().split('T')[0];
    
    const { data: checkedIn, error: checkedInError } = await supabase
      .from('attendance')
      .select(`
        id,
        child_id,
        checked_in_at,
        checked_out_at,
        children(first_name, last_name),
        classes(name)
      `)
      .eq('attendance_date', todayDate)
      .order('checked_in_at', { ascending: false })
      .limit(10);

    if (checkedInError) {
      console.error("Error fetching activity data:", checkedInError);
      throw new Error(`Failed to fetch activity data: ${checkedInError.message}`);
    }

    return checkedIn.map((record) => {
      const childName = `${record.children?.first_name || ''} ${record.children?.last_name || ''}`;
      const className = record.classes?.name || 'Unknown Class';
      const status = record.checked_out_at ? 'Checked out' : 'Checked in';
      const time = record.checked_out_at 
        ? new Date(record.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: record.id,
        name: childName.trim(),
        class: className,
        status,
        time
      };
    });
  } catch (error) {
    console.error("Error in fetchRecentActivity:", error);
    throw error;
  }
}

async function fetchClassStatus(): Promise<ClassStatusItem[]> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        capacity
      `);

    if (error) {
      console.error("Error fetching class status:", error);
      throw new Error(`Failed to fetch class status: ${error.message}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const classesWithCounts = await Promise.all(data.map(async (classItem) => {
      const { count: childrenCount, error: childrenError } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('class_id', classItem.id)
        .eq('attendance_date', today)
        .is('checked_out_at', null);

      const { count: teacherCount, error: teacherError } = await supabase
        .from('teachers')
        .select('*', { count: 'exact' })
        .eq('class_id', classItem.id);

      if (childrenError || teacherError) {
        console.error("Error fetching counts:", childrenError || teacherError);
        throw new Error(`Failed to fetch counts: ${(childrenError || teacherError).message}`);
      }

      return {
        id: classItem.id,
        name: classItem.name,
        children: childrenCount || 0,
        teachers: teacherCount || 0,
        active: true
      };
    }));

    return classesWithCounts;
  } catch (error) {
    console.error("Error in fetchClassStatus:", error);
    throw error;
  }
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { count: checkedInCount, error: checkedInError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('attendance_date', today);

    const { count: checkedOutCount, error: checkedOutError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('attendance_date', today)
      .not('checked_out_at', 'is', null);

    const { count: classesCount, error: classesError } = await supabase
      .from('classes')
      .select('*', { count: 'exact' });

    // In a real app, you might fetch this from a dedicated alerts table
    const alertsCount = 2;

    if (checkedInError || checkedOutError || classesError) {
      console.error("Error fetching dashboard stats:", 
        checkedInError || checkedOutError || classesError);
      throw new Error(`Failed to fetch dashboard stats: ${(checkedInError || checkedOutError || classesError).message}`);
    }

    return {
      checkedIn: checkedInCount || 0,
      checkedOut: checkedOutCount || 0,
      classes: classesCount || 0,
      alerts: alertsCount
    };
  } catch (error) {
    console.error("Error in fetchDashboardStats:", error);
    throw error;
  }
}
