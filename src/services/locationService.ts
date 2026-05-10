
export class LocationService {
  /**
   * Validates if the current user is within the authorized Nursery WiFi network.
   * This is a zero-cost security measure for the "Wall QR" check-in.
   */
  static async isUserOnSite(): Promise<{ onSite: boolean; ip?: string }> {
    try {
      // In a real production app, we hit an endpoint that returns the user's public IP
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const userIp = data.ip;

      // Fetch the authorized office IP from your configuration or database
      // For now, we mock the authorized IP check
      const AUTHORIZED_IP = localStorage.getItem('kc_authorized_nursery_ip');

      if (!AUTHORIZED_IP) {
        console.warn("[Security] No authorized IP set for this station.");
        return { onSite: true }; // Default to true if not configured yet
      }

      const onSite = userIp === AUTHORIZED_IP;
      return { onSite, ip: userIp };
    } catch (error) {
      console.error("[Security] Failed to verify IP location:", error);
      return { onSite: false };
    }
  }

  /**
   * Sets the current network as the "Authorized" one (Admin Only)
   */
  static async authorizeCurrentNetwork() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    localStorage.setItem('kc_authorized_nursery_ip', data.ip);
    return data.ip;
  }
}
