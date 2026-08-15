
import { toast } from "@/hooks/useToast";

/**
 * Gets the configured Print Server Proxy URL.
 * Falls back to http://localhost:3003/print if no custom server IP is set.
 */
export const getPrintProxyUrl = (): string => {
  const customHost = localStorage.getItem('kiddochecker_print_server_url') || localStorage.getItem('kiddochecker_print_server_ip');
  if (customHost && customHost.trim()) {
    let raw = customHost.trim();
    let protocol = 'http://';
    if (raw.startsWith('https://')) {
      protocol = 'https://';
      raw = raw.replace(/^https:\/\//, '');
    } else if (raw.startsWith('http://')) {
      raw = raw.replace(/^http:\/\//, '');
    }

    // Strip trailing /print or slashes
    raw = raw.replace(/\/+print\/?$/, '').replace(/\/+$/, '');

    // Check if port is specified
    if (!raw.includes(':')) {
      raw = `${raw}:3003`;
    }
    return `${protocol}${raw}/print`;
  }
  return 'http://localhost:3003/print';
};

export const getPrintProxyBaseUrl = (): string => {
  const full = getPrintProxyUrl();
  return full.replace(/\/print$/, '');
};

export class PrintService {
  /**
   * Checks health of the local print proxy server.
   */
  static async checkLocalProxyHealth(): Promise<{ ok: boolean; data?: any; error?: string }> {
    const baseUrl = getPrintProxyBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Local proxy unreachable' };
    }
  }

  /**
   * Checks health of the Azure Cloud Print Relay.
   */
  static async checkCloudRelayHealth(): Promise<{ ok: boolean; data?: any; error?: string }> {
    const baseUrl = import.meta.env.VITE_API_URL || "https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io";
    try {
      const res = await fetch(`${baseUrl}/api/print-jobs/health`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Cloud relay unreachable' };
    }
  }

  /**
   * Attempts silent printing via Azure Cloud Print Relay or local print proxy. 
   * Fails over to standard browser printing if unavailable.
   */
  static async printChildLabel(childData: { name: string; allergies?: string; class?: string; securityCode?: string; qrData?: string; orgId?: string }) {
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
          printerName: targetPrinterName,
          orgId: childData.orgId || localStorage.getItem('kiddochecker_org_id') || 'default_org'
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
        const result = await response.json();
        console.log("[Printer] Silent print response via local proxy:", result);
        return { success: true, method: 'proxy', result };
      }
    } catch (err) {
      console.warn(`[Printer] Print proxy at ${proxyUrl} unreachable. Falling back to manual browser print.`);
    }

    // 3. Fallback to Browser Print (Manual)
    window.print();
    return { success: true, method: 'manual' };
  }
}

