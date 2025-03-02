
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    queryFn: fetchRecentActivity
  });
}

export function useClassStatus() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClassStatus
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });
}

async function fetchRecentActivity(): Promise<ActivityRecord[]> {
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
    return [];
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
}

async function fetchClassStatus(): Promise<ClassStatusItem[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      capacity
    `);

  if (error) {
    console.error("Error fetching class status:", error);
    return [];
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
}

async function fetchDashboardStats(): Promise<DashboardStats> {
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

  const alertsCount = 2;

  if (checkedInError || checkedOutError || classesError) {
    console.error("Error fetching dashboard stats:", 
      checkedInError || checkedOutError || classesError);
  }

  return {
    checkedIn: checkedInCount || 0,
    checkedOut: checkedOutCount || 0,
    classes: classesCount || 0,
    alerts: alertsCount
  };
}
