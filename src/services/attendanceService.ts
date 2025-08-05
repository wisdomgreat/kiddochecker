
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
      console.log("Checking in child:", data.childId);
      
      // Use direct RPC call with proper error handling
      const { data: result, error } = await supabase.rpc('checkin_child' as any, {
        p_child_id: data.childId,
        p_class_id: data.classId || null,
        p_checked_in_by: data.checkedInBy || null
      });

      if (error) {
        console.error("Check-in error:", error);
        return { success: false, error: error.message };
      }

      console.log("Child checked in successfully with attendance ID:", result);
      return { success: true, attendanceId: result as string };
    } catch (error: any) {
      console.error("Exception during check-in:", error);
      return { success: false, error: error.message };
    }
  }

  static async checkOutChild(data: CheckOutData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Checking out child with attendance ID:", data.attendanceId);
      
      // Use direct RPC call with proper error handling
      const { data: result, error } = await supabase.rpc('checkout_child' as any, {
        p_attendance_id: data.attendanceId,
        p_checked_out_by: data.checkedOutBy || null
      });

      if (error) {
        console.error("Check-out error:", error);
        return { success: false, error: error.message };
      }

      if (!result) {
        return { success: false, error: "Child was already checked out or attendance record not found" };
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

  static async getAttendanceHistory(childId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          child:children(*),
          class:classes(*)
        `)
        .eq('child_id', childId)
        .order('attendance_date', { ascending: false })
        .order('checked_in_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching attendance history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Exception fetching attendance history:", error);
      return [];
    }
  }
}
