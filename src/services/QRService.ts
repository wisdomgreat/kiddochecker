
import { supabase } from "@/integrations/supabase/client";

export type QRScanResult = 
  | { type: 'child', id: string, data?: any }
  | { type: 'parent', id: string, data?: any }
  | { type: 'error', message: string };

export const QRService = {
  /**
   * Consistently parse any QR data and return a standard result.
   * Handles:
   * 1. JSON (legacy/advanced)
   * 2. child:[UUID] (static offline)
   * 3. [UUID] (dynamic DB token)
   * 4. Raw UUID (child ID direct match)
   */
  parseAndVerify: async (rawQRData: string): Promise<QRScanResult> => {
    const data = rawQRData.trim();
    console.log("[QRService] Parsing:", data);

    // 1. Try JSON
    try {
      if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        const id = parsed.id || parsed.child_id || parsed.parentId;
        if (id) {
          if (parsed.type?.includes('CHILD') || parsed.type === 'CHECKIN' || parsed.type === 'CHECKOUT') {
            return { type: 'child', id };
          }
          if (parsed.type?.includes('FAMILY') || parsed.type === 'PARENT') {
            return { type: 'parent', id };
          }
        }
      }
    } catch { }

    // 2. Try child: prefix (Static Offline)
    if (data.toLowerCase().startsWith('child:')) {
      const id = data.split(':')[1];
      if (id) return { type: 'child', id };
    }

    // 3. Try Database Lookup (Dynamic Token)
    const { data: qrRecord } = await supabase
      .from('qr_codes')
      .select('child_id, is_active')
      .eq('qr_data', data)
      .eq('is_active', true)
      .maybeSingle();

    if (qrRecord) {
      return { type: 'child', id: qrRecord.child_id };
    }

    // 4. Try Raw UUID direct match to child
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(data)) {
      // Check if it's a child ID
      const { data: child } = await supabase
        .from('children')
        .select('id')
        .eq('id', data)
        .maybeSingle();
      
      if (child) return { type: 'child', id: child.id };

      // Check if it's a parent profile ID
      const { data: parent } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data)
        .maybeSingle();
      
      if (parent) return { type: 'parent', id: parent.id };
    }

    return { type: 'error', message: 'QR Code not recognized in system' };
  },

  /**
   * Ensure every child has at least one active QR code in the system.
   */
  syncAllChildren: async () => {
    const { data: children } = await supabase.from('children').select('id');
    if (!children) return { success: false, count: 0 };

    let created = 0;
    for (const child of children) {
      const { data: existing } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('child_id', child.id)
        .eq('is_active', true)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('qr_codes').insert({
          child_id: child.id,
          qr_data: window.crypto.randomUUID()
        });
        created++;
      }
    }
    return { success: true, count: created };
  },

  /**
   * NUCLEAR OPTION: Delete/Deactivate all active QR codes and generate fresh ones for EVERY child.
   * WARNING: Previously printed labels will stop working.
   */
  regenerateAll: async () => {
    // 1. Deactivate all existing codes
    await supabase.from('qr_codes').update({ is_active: false }).eq('is_active', true);

    // 2. Generate new ones for everyone
    const { data: children } = await supabase.from('children').select('id');
    if (!children) return { success: false, count: 0 };

    const inserts = children.map(c => ({
      child_id: c.id,
      qr_data: window.crypto.randomUUID(),
      is_active: true
    }));

    const { error } = await supabase.from('qr_codes').insert(inserts);
    if (error) throw error;

    return { success: true, count: inserts.length };
  }
};
