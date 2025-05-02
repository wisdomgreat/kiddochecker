
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
            title: `Attendance ${actionMap[event as keyof typeof actionMap] || 'changed'}`,
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
    
    // Use a direct join approach instead of relying on implicit relationships
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        checked_in_at,
        checked_out_at,
        attendance_date,
        child:child_id (
          first_name,
          last_name
        ),
        class:class_id (
          name
        )
      `)
      .eq('attendance_date', todayDate)
      .order('checked_in_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching activity data:", error);
      throw new Error(`Failed to fetch activity data: ${error.message}`);
    }

    return (data || []).map((record) => {
      // Safe access to nested properties
      const firstName = record.child?.first_name || '';
      const lastName = record.child?.last_name || '';
      const childName = `${firstName} ${lastName}`;
      const className = record.class?.name || 'Unknown Class';
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
    // Get all classes
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, capacity');

    if (error) {
      console.error("Error fetching class status:", error);
      throw new Error(`Failed to fetch class status: ${error.message}`);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get attendance counts per class using a single query
    const { data: attendanceCounts, error: attendanceError } = await supabase
      .rpc('get_attendance_report', { 
        start_date: today, 
        end_date: today 
      });
      
    if (attendanceError) {
      console.error("Error fetching attendance counts:", attendanceError);
      throw new Error(`Failed to fetch attendance counts: ${attendanceError.message}`);
    }

    // Get teacher counts per class
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('class_id');

    if (teacherError) {
      console.error("Error fetching teacher data:", teacherError);
      throw new Error(`Failed to fetch teacher data: ${teacherError.message}`);
    }

    // Count teachers per class
    const teacherCounts = teacherData?.reduce((acc: Record<string, number>, teacher) => {
      if (teacher.class_id) {
        acc[teacher.class_id] = (acc[teacher.class_id] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    // Map attendance data to each class
    return (data || []).map((classItem) => {
      const attendanceItem = attendanceCounts?.find(
        (item: any) => item.class_id === classItem.id
      );
      
      return {
        id: classItem.id,
        name: classItem.name,
        children: attendanceItem?.total_checked_in || 0,
        teachers: teacherCounts[classItem.id] || 0,
        active: true
      };
    });
  } catch (error) {
    console.error("Error in fetchClassStatus:", error);
    throw error;
  }
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get attendance stats using our new function
    const { data: attendanceData, error: attendanceError } = await supabase
      .rpc('get_attendance_report', {
        start_date: today,
        end_date: today
      });
      
    if (attendanceError) {
      console.error("Error fetching attendance stats:", attendanceError);
      throw new Error(`Failed to fetch attendance stats: ${attendanceError.message}`);
    }
    
    // Calculate totals from all classes
    let totalCheckedIn = 0;
    let totalCheckedOut = 0;
    
    if (attendanceData && Array.isArray(attendanceData)) {
      attendanceData.forEach((item: any) => {
        totalCheckedIn += item.total_checked_in || 0;
        totalCheckedOut += item.total_checked_out || 0;
      });
    }
    
    // Get classes count
    const { count: classesCount, error: classesError } = await supabase
      .from('classes')
      .select('*', { count: 'exact' });

    if (classesError) {
      console.error("Error fetching classes count:", classesError);
      throw new Error(`Failed to fetch classes count: ${classesError.message}`);
    }

    // In a real app, you might fetch this from a dedicated alerts table
    const alertsCount = 2;

    return {
      checkedIn: totalCheckedIn,
      checkedOut: totalCheckedOut,
      classes: classesCount || 0,
      alerts: alertsCount
    };
  } catch (error) {
    console.error("Error in fetchDashboardStats:", error);
    throw error;
  }
}
