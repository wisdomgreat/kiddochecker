
import { supabase } from "@/integrations/supabase/client";

export class ReportSealingService {
  /**
   * Generates a cryptographic seal for a given report data
   * @param reportName The human-readable name of the report
   * @param reportData The JSON data of the report
   */
  static async sealReport(reportName: string, reportData: any): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      // 1. Serialize and Hash the data
      const jsonStr = JSON.stringify(reportData);
      const msgUint8 = new TextEncoder().encode(jsonStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 2. Store the seal in the database
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('report_seals' as any)
        .insert({
          report_name: reportName,
          report_hash: hashHex,
          generated_by: user.user?.id
        });

      if (error) throw error;

      return { success: true, hash: hashHex };
    } catch (err: any) {
      console.error('[SealingService] Failed to seal report:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches all report seals for verification
   */
  static async getReportSeals(): Promise<any[]> {
    const { data, error } = await supabase
      .from('report_seals' as any)
      .select('*, generated_by_profile:profiles(first_name, last_name)')
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('[SealingService] Error fetching seals:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Fetches data access logs
   */
  static async getDataAccessLogs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('data_access_logs' as any)
      .select('*, user:profiles(first_name, last_name)')
      .order('accessed_at', { ascending: false });

    if (error) {
      console.error('[SealingService] Error fetching access logs:', error);
      return [];
    }
    return data || [];
  }
}
