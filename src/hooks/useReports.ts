
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AttendanceReport {
  attendance_date: string;
  child_name: string;
  class_name: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_hours: number | null;
}

export interface AttendanceSummary {
  attendance_date: string;
  total_checked_in: number;
  total_checked_out: number;
  class_name: string;
  class_id: string;
}

export const useReports = () => {
  const getAttendanceReport = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ["attendance-report", startDate, endDate],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
          start_date: startDate,
          end_date: endDate,
        });
        if (error) throw error;
        return data as AttendanceReport[];
      },
      enabled: !!startDate && !!endDate,
    });
  };

  const getAttendanceSummary = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ["attendance-summary", startDate, endDate],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_attendance_report', {
          start_date: startDate,
          end_date: endDate,
        });
        if (error) throw error;
        return data as AttendanceSummary[];
      },
      enabled: !!startDate && !!endDate,
    });
  };

  const getClassRoster = (classId: string, date: string) => {
    return useQuery({
      queryKey: ["class-roster", classId, date],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_class_roster_with_attendance', {
          class_id_param: classId,
          date_param: date,
        });
        if (error) throw error;
        return data;
      },
      enabled: !!classId && !!date,
    });
  };

  return {
    getAttendanceReport,
    getAttendanceSummary,
    getClassRoster,
  };
};
