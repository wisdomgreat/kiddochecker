
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

    let detectedId: string | null = null;
    let suspectedType: 'child' | 'parent' | null = null;

    // 1. Try JSON
    try {
      if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        detectedId = parsed.id || parsed.child_id || parsed.parentId;
        
        const type = String(parsed.type || '').toUpperCase();
        if (type.includes('CHILD') || type.includes('CHECK') || type.includes('YOUTH')) {
          suspectedType = 'child';
        } else if (type.includes('PARENT') || type.includes('FAMILY') || type.includes('KIOSK')) {
          suspectedType = 'parent';
        }
      }
    } catch { }

    // 2. Try prefixed strings
    if (!detectedId) {
      if (data.toLowerCase().startsWith('child:')) {
        detectedId = data.split(':')[1];
        suspectedType = 'child';
      } else if (data.toLowerCase().startsWith('parent:')) {
        detectedId = data.split(':')[1];
        suspectedType = 'parent';
      }
    }

    // 3. Try UUID direct match or Token Lookup
    if (!detectedId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(data)) {
        detectedId = data;
      } else {
        // Assume dynamic token
        const { data: qrRecord } = await supabase
          .from('qr_codes')
          .select('child_id')
          .eq('qr_data', data)
          .eq('is_active', true)
          .maybeSingle();
        
        if (qrRecord) {
          detectedId = qrRecord.child_id;
          suspectedType = 'child';
        }
      }
    }

    if (!detectedId) {
      return { type: 'error', message: `Unrecognized Code Format` };
    }

    // VERIFICATION STEP: Crucial to avoid "Profile Not Found" errors in UI
    console.log("[QRService] Verifying detected ID:", detectedId);
    
    // Check children table
    const { data: child } = await supabase.from('children').select('id').eq('id', detectedId).maybeSingle();
    if (child) return { type: 'child', id: child.id };

    // Check profiles table
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', detectedId).maybeSingle();
    if (profile) return { type: 'parent', id: profile.id };

    // If we have an ID but it's not in either table, it's a dead reference
    return { type: 'error', message: `ID ${detectedId.substring(0,8)}... not found in database.` };
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
