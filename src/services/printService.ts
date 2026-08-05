
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
   * Attempts silent printing via Azure Cloud Print Relay or local print proxy. 
   * Fails over to standard browser printing if unavailable.
   */
  static async printChildLabel(childData: { name: string; allergies?: string; class?: string; securityCode?: string; qrData?: string }) {
    const targetPrinterIp = localStorage.getItem('kiddochecker_target_printer_ip') || '';
    const targetPrinterName = localStorage.getItem('kiddochecker_target_printer_name') || '';

    // 1. Try Azure Cloud Print Relay (HTTPS - Immune to browser Mixed Content blocks)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io";
      const response = await fetch(`${baseUrl}/api/print-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelData: childData,
          printerIp: targetPrinterIp,
          printerName: targetPrinterName
        }),
      });

      if (response.ok) {
        console.log("[Printer] Print job queued successfully via Azure Cloud Relay.");
        return { success: true, method: 'cloud-relay' };
      }
    } catch (cErr) {
      console.warn("[Printer] Azure Cloud Relay unreachable, falling back to local proxy:", cErr);
    }

    // 2. Try Direct Local Print Proxy
    const proxyUrl = getPrintProxyUrl();
    console.log(`[Printer] Attempting auto-print for ${childData.name} via ${proxyUrl}...`);

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelData: childData,
          printerIp: targetPrinterIp,
          printerName: targetPrinterName
        }),
      });

      if (response.ok) {
        console.log("[Printer] Silent print successful via local proxy.");
        return { success: true, method: 'proxy' };
      }
    } catch (err) {
      console.warn(`[Printer] Print proxy at ${proxyUrl} unreachable. Falling back to manual browser print.`);
    }

    // 3. Fallback to Browser Print (Manual)
    window.print();
    return { success: true, method: 'manual' };
  }
}

