import { bridge } from "@/lib/bridgeClient";
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
      console.log("[Bridge] Checking in child:", data.childId);
      const metadata = data.deviceMetadata || this.getDeviceMetadata();

      // Use Bridge RPC call
      const { data: result, error } = await bridge.rpc('checkin_child', {
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
      });

      if (error) {
        console.error("[Bridge] Check-in error:", error);
        return { success: false, error: error.message };
      }

      // Supabase RPC returns a scalar for checkin_child (the ID)
      const attendanceId = Array.isArray(result) ? result[0]?.checkin_child : result;
      console.log("[Bridge] Child checked in successfully with ID:", attendanceId);
      return { success: true, attendanceId: attendanceId as string };
    } catch (error: any) {
      console.error("[Bridge] Exception during check-in:", error);
      return { success: false, error: error.message };
    }
  }

  static async checkOutChild(data: CheckOutData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[Bridge] Checking out attendance ID:", data.attendanceId);
      const metadata = data.deviceMetadata || this.getDeviceMetadata();

      // Use Bridge RPC call
      const { data: result, error } = await bridge.rpc('checkout_child', {
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
      });

      if (error) {
        console.error("[Bridge] Check-out error:", error);
        return { success: false, error: error.message };
      }

      console.log("[Bridge] Child checked out successfully");
      return { success: true };
    } catch (error: any) {
      console.error("[Bridge] Exception during check-out:", error);
      return { success: false, error: error.message };
    }
  }

  static async getTodaysAttendance(): Promise<AttendanceRecord[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Using Bridge with explicit joins for names and classes
      const { data, error } = await bridge
        .from('attendance')
        .select('*, child:children(*), class:classes(*)')
        .eq('attendance_date', today);

      if (error) {
        console.error("[Bridge] Error fetching attendance:", error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error("[Bridge] Exception fetching attendance:", error);
      return [];
    }
  }

  static async getCheckedInChildren(): Promise<AttendanceRecord[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Use .is('checked_out_at', null) for proper SQL 'IS NULL' handling through bridge
      // Also filter by today's date to keep the 'Present' count consistent with 'Total'
      const { data, error } = await bridge
        .from('attendance')
        .select('*, child:children(*), class:classes(*)')
        .is('checked_out_at', null)
        .eq('attendance_date', today);

      if (error) {
        console.error("[Bridge] Error fetching checked-in children:", error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error("[Bridge] Exception fetching checked-in children:", error);
      return [];
    }
  }

  static async getAttendanceHistory(childId: string, limit: number = 10): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await bridge
        .from('attendance')
        .select('*')
        .eq('child_id', childId);
      
      // Note: Ordering and limits are pending enhanced BridgeClient support
      if (error) {
        console.error("[Bridge] Error fetching attendance history:", error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error("[Bridge] Exception fetching attendance history:", error);
      return [];
    }
  }
}

