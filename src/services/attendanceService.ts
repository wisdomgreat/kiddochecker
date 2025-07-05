
import { supabase } from "@/integrations/supabase/client";

export interface CheckInData {
  childId: string;
  classId?: string;
  checkedInBy?: string;
}

export interface CheckOutData {
  attendanceId: string;
  checkedOutBy?: string;
}

export class AttendanceService {
  static async checkInChild(data: CheckInData): Promise<{ success: boolean; attendanceId?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('attendance')
        .insert({
          child_id: data.childId,
          class_id: data.classId || null,
          checked_in_by: data.checkedInBy || null,
          checked_in_at: new Date().toISOString(),
          attendance_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) {
        console.error("Check-in error:", error);
        return { success: false, error: error.message };
      }

      console.log("Child checked in successfully:", result.id);
      return { success: true, attendanceId: result.id };
    } catch (error: any) {
      console.error("Exception during check-in:", error);
      return { success: false, error: error.message };
    }
  }

  static async checkOutChild(data: CheckOutData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          checked_out_at: new Date().toISOString(),
          checked_out_by: data.checkedOutBy || null
        })
        .eq('id', data.attendanceId)
        .is('checked_out_at', null); // Only update if not already checked out

      if (error) {
        console.error("Check-out error:", error);
        return { success: false, error: error.message };
      }

      console.log("Child checked out successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Exception during check-out:", error);
      return { success: false, error: error.message };
    }
  }

  static async getTodaysAttendance(): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          child:children(*),
          class:classes(*)
        `)
        .eq('attendance_date', today)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error("Error fetching attendance:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Exception fetching attendance:", error);
      return [];
    }
  }

  static async getCheckedInChildren(): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          child:children(*),
          class:classes(*)
        `)
        .eq('attendance_date', today)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error("Error fetching checked-in children:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Exception fetching checked-in children:", error);
      return [];
    }
  }
}
