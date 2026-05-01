
import { supabase } from "@/integrations/supabase/client";
import { AttendanceRecord } from "@/types/attendance";

export interface CheckInData {
  childId: string;
  classId?: string;
  checkedInBy?: string;
  qrToken?: string;
  method?: string;
  station?: string;
  specialInstructions?: string;
  hasFever?: boolean;
  hasCough?: boolean;
  deviceMetadata?: Record<string, any>;
  deviceId?: string;
}

export interface CheckOutData {
  attendanceId: string;
  checkedOutBy?: string;
  qrToken?: string;
  method?: string;
  station?: string;
  signatureData?: string;
  overrideReason?: string;
  pickupSnapshot?: any[];
  witnessId?: string;
  deviceMetadata?: Record<string, any>;
  deviceId?: string;
}


export class AttendanceService {
  private static getDeviceMetadata(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : 'unknown'
    };
  }

  static async checkInChild(data: CheckInData): Promise<{ success: boolean; attendanceId?: string; error?: string }> {
    try {
      console.log("Checking in child:", data.childId);
      const metadata = data.deviceMetadata || this.getDeviceMetadata();

      // Use direct RPC call with proper error handling
      const { data: result, error } = await supabase.rpc('checkin_child', {
        p_child_id: data.childId,
        p_class_id: data.classId || null,
        p_checked_in_by: data.checkedInBy || null,
        p_qr_token: data.qrToken || null,
        p_method: data.method || 'app_dashboard',
        p_station: data.station || null,
        p_special_instructions: data.specialInstructions || null,
        p_health_fever: data.hasFever || false,
        p_health_cough: data.hasCough || false,
        p_device_metadata: metadata,
        p_device_id: data.deviceId || null
      } as any);

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
      const metadata = data.deviceMetadata || this.getDeviceMetadata();

      // Use direct RPC call with proper error handling
      const { data: result, error } = await supabase.rpc('checkout_child', {
        p_attendance_id: data.attendanceId,
        p_checked_out_by: data.checkedOutBy || null,
        p_qr_token: data.qrToken || null,
        p_method: data.method || 'app_dashboard',
        p_station: data.station || null,
        p_signature_data: data.signatureData || null,
        p_override_reason: data.overrideReason || null,
        p_pickup_snapshot: data.pickupSnapshot || null,
        p_device_metadata: metadata,
        p_witness_id: data.witnessId || null,
        p_device_id: data.deviceId || null
      } as any);


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

  static async getTodaysAttendance(): Promise<AttendanceRecord[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          child:children(*),
          class:classes(*),
          incidents(*),
          care_logs(*)
        `)
        .or(`attendance_date.eq.${today},checked_out_at.is.null`)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error("Error fetching attendance:", error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error("Exception fetching attendance:", error);
      return [];
    }
  }

  static async getCheckedInChildren(): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          child:children(*),
          class:classes(*)
        `)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error("Error fetching checked-in children:", error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error("Exception fetching checked-in children:", error);
      return [];
    }
  }

  static async getAttendanceHistory(childId: string, limit: number = 10): Promise<AttendanceRecord[]> {
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

      return (data as any) || [];
    } catch (error) {
      console.error("Exception fetching attendance history:", error);
      return [];
    }
  }
}

