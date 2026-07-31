
import { toast } from "@/hooks/useToast";

/**
 * Gets the configured Print Server Proxy URL.
 * Falls back to http://localhost:3003/print if no custom server IP is set.
 */
export const getPrintProxyUrl = (): string => {
  const customHost = localStorage.getItem('kiddochecker_print_server_url') || localStorage.getItem('kiddochecker_print_server_ip');
  if (customHost && customHost.trim()) {
    let formatted = customHost.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    if (!formatted.includes(':3003') && !formatted.endsWith('/print')) {
      formatted = `${formatted}:3003/print`;
    } else if (!formatted.endsWith('/print')) {
      formatted = `${formatted}/print`;
    }
    return formatted;
  }
  return 'http://localhost:3003/print';
};

export class PrintService {
  /**
   * Attempts silent printing via local/remote print proxy. 
   * Fails over to standard browser printing if proxy is unavailable.
   */
  static async printChildLabel(childData: { name: string; allergies?: string; class?: string; securityCode?: string; qrData?: string }) {
    const proxyUrl = getPrintProxyUrl();
    console.log(`[Printer] Attempting auto-print for ${childData.name} via ${proxyUrl}...`);

    try {
      // 1. Try Print Proxy (Silent)
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelData: childData }),
      });

      if (response.ok) {
        console.log("[Printer] Silent print successful via proxy.");
        return { success: true, method: 'proxy' };
      }
    } catch (err) {
      console.warn(`[Printer] Print proxy at ${proxyUrl} unreachable. Falling back to manual browser print.`);
    }

    // 2. Fallback to Browser Print (Manual)
    // We trigger the standard print dialog
    window.print();
    
    return { success: true, method: 'manual' };
  }
}

