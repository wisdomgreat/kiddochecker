# Phase 3 Context: Location Security & IP Lockdown

## Goal
Restrict kiosk terminal logins (both PIN-based and NFC-based) to authorized physical network ranges dynamically defined by administrators.

## Success Criteria
1. PIN lookup (`get_parent_for_kiosk`), staff login (`verify_staff_pin_for_kiosk`), youth check-in (`youth_self_check_action`), and NFC tag login queries are verified against allowed client IP addresses on the backend Express Bridge API.
2. Admins can dynamically configure the allowed IP addresses list (`allowed_ips`) and enable/disable the lockdown feature (`enable_ip_lockdown`) from the Kiosk Security tab in the Admin settings panel.
3. Kiosk PIN login requests from unauthorized IP addresses are automatically blocked with a clear terminal security notice.

## Key Abstractions
- **IP Matcher Helper (`ipMatches`)**: Vanilla JS regex & bitwise function supporting exact IPs, wildcard subnets (e.g. `192.168.1.*`), and CIDR blocks (e.g. `10.0.0.0/8`).
- **Dynamic Settings DB Check**: Reads settings directly from `public.kiosk_settings` to ensure 100% live configuration updates without server restarts.
- **Auto-fallback / Fail-open**: If database query fails, fail-open to ensure continuity, but log severe warnings.
