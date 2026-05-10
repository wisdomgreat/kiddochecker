
import { toast } from "@/hooks/useToast";

export class PrintService {
  private static PROXY_URL = 'http://localhost:3001/print';

  /**
   * Attempts silent printing via local proxy. 
   * Fails over to standard browser printing if proxy is unavailable.
   */
  static async printChildLabel(childData: { name: string; allergies?: string; class?: string }) {
    console.log(`[Printer] Attempting auto-print for ${childData.name}...`);

    try {
      // 1. Try Local Proxy (Silent)
      const response = await fetch(this.PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelData: childData }),
      });

      if (response.ok) {
        console.log("[Printer] Silent print successful.");
        return { success: true, method: 'proxy' };
      }
    } catch (err) {
      console.warn("[Printer] Local proxy not found. Falling back to manual print.");
    }

    // 2. Fallback to Browser Print (Manual)
    // We trigger the standard print dialog
    window.print();
    
    return { success: true, method: 'manual' };
  }
}
