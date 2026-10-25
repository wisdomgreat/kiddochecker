-- ============================================================================
-- Security Remediation & Compliance Issues Tracker Table
-- Standard Mappings: OWASP Top 10 (2021), NIST SP 800-53 Rev. 5, ISO/IEC 27001:2022
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_remediation_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vuln_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  category TEXT NOT NULL,
  owasp_category TEXT NOT NULL,
  nist_control TEXT NOT NULL,
  iso_control TEXT NOT NULL,
  cvss_score NUMERIC(3, 1) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'verified')),
  affected_component TEXT NOT NULL,
  remediation_details TEXT NOT NULL,
  verification_test TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_issues_severity ON public.security_remediation_issues(severity);
CREATE INDEX IF NOT EXISTS idx_sec_issues_status ON public.security_remediation_issues(status);

-- Seed comprehensive findings
INSERT INTO public.security_remediation_issues 
(vuln_code, title, severity, category, owasp_category, nist_control, iso_control, cvss_score, status, affected_component, remediation_details, verification_test)
VALUES
('SEC-01', 'Complete Authentication Bypass via Unverified jwt.decode & Permissive Token Fallback', 'critical', 'Authentication', 'A07:2021 - Identification & Auth Failures', 'AC-3, IA-2, IA-8', 'A.5.15, A.8.24', 10.0, 'resolved', 'server/index.js (verifyToken)', 'Removed jwt.decode signature bypass; enforced strict jwt.verify fail-closed with 401 on missing or invalid tokens.', 'Requests with unsigned or invalid tokens receive 401 Unauthorized.'),
('SEC-02', 'Direct Remote Database Takeover via Exposed /api/admin/run-sql & Hardcoded Master Admin Secret', 'critical', 'Access Control', 'A03:2021 - Injection', 'AC-6, SI-10', 'A.8.2, A.8.28', 10.0, 'resolved', 'server/index.js (/api/admin/run-sql)', 'Completely removed /api/admin/run-sql endpoint and purged all hardcoded backdoor keys from source code.', 'HTTP POST to /api/admin/run-sql returns 404 Not Found.'),
('SEC-03', 'Public Self-Registration Privilege Escalation to super_admin', 'critical', 'Access Control', 'A01:2021 - Broken Access Control', 'AC-2, AC-3', 'A.5.15, A.8.2', 9.8, 'resolved', 'server/index.js (/api/auth/signup)', 'Hardcoded role to parent for public self-registration; prevented client from overriding assigned role.', 'Public registration with role: super_admin creates parent user.'),
('SEC-04', 'Unauthenticated Exposure of Family PII and Security PINs via Duplicate Endpoints', 'critical', 'Information Disclosure', 'A01:2021 - Broken Access Control', 'AC-3, SC-28', 'A.8.3, A.8.12', 9.1, 'resolved', 'server/index.js (/api/emails/logs, /api/emails/stats)', 'Removed duplicate unauthenticated email logs and stats routes; protected verified routes with RBAC.', 'Unauthenticated GET /api/emails/logs returns 401 Unauthorized.'),
('SEC-05', 'Unrestricted Multi-Tenant Database Proxy (/api/query, /api/mutate)', 'critical', 'Access Control', 'A01:2021 - Broken Access Control', 'AC-3, AC-6', 'A.8.3, A.8.28', 9.8, 'resolved', 'server/index.js (/api/query, /api/mutate)', 'Enforced table whitelisting and user-level ownership checks preventing unauthorized cross-table mutations.', 'Attempting to mutate user_roles or profiles without admin privileges returns 403 Forbidden.'),
('SEC-06', 'Hardcoded Secrets in Code and Plaintext Secrets in .env', 'critical', 'Cryptographic Failures', 'A02:2021 - Cryptographic Failures', 'IA-5, SC-12', 'A.8.24, A.8.31', 8.6, 'resolved', 'server/index.js, .env, infra/main.bicep', 'Purged fallback secrets; ensured runtime throws an error if critical secrets are missing in production.', 'Application verifies env variables on startup without falling back to insecure defaults.'),
('SEC-07', 'Multi-Tenant RLS Session Pollution in tenantResolver', 'high', 'Data Isolation', 'A01:2021 - Broken Access Control', 'AC-3, SC-28', 'A.8.3, A.8.28', 8.5, 'resolved', 'server/middleware/tenantResolver.js', 'Fixed connection pool context isolation by binding church context to request object without pool session pollution.', 'Tenant queries isolate context strictly per request.'),
('SEC-08', 'Unauthenticated Open Mail and SMS Relay Endpoints', 'high', 'Abuse & Denial of Service', 'A04:2021 - Insecure Design', 'AC-14, SC-5', 'A.8.20, A.8.28', 8.2, 'resolved', 'server/index.js (/api/functions/send-email, /api/functions/send-sms)', 'Added authentication and staff/admin role requirements with rate limiting to email and SMS functions.', 'Calling send-email or send-sms without valid token returns 401 Unauthorized.'),
('SEC-09', 'CORS Misconfiguration: Permissive Wildcard Reflection with Credentials', 'high', 'Security Misconfiguration', 'A05:2021 - Security Misconfiguration', 'SC-7, SC-8', 'A.8.20', 7.5, 'resolved', 'server/index.js (cors middleware)', 'Replaced wildcard reflection with strict origin whitelist callback.', 'Cross-origin requests from unapproved domains are rejected.'),
('SEC-10', 'Plaintext Security PIN Storage and Predictable Device Credentials', 'high', 'Cryptographic Failures', 'A02:2021 - Cryptographic Failures', 'IA-5, SC-28', 'A.8.24', 7.7, 'resolved', 'server/index.js (PIN & Device logic)', 'Sanitized PIN logs; generated cryptographically secure random device secrets.', 'No plaintext passwords returned in API JSON responses.'),
('SEC-11', 'Database TLS Certificate Validation Disabled (rejectUnauthorized: false)', 'high', 'Network Security', 'A02:2021 - Cryptographic Failures', 'SC-8, SC-13', 'A.8.24', 7.4, 'in_progress', 'server/index.js, tenantResolver.js', 'Configured CA certificate verification option for production PostgreSQL connection pool.', 'TLS handshake enforces certificate validation in production.'),
('SEC-12', 'Sensitive PII and Password Reset Tokens Leaked in Server Logs', 'medium', 'Information Disclosure', 'A09:2021 - Logging & Monitoring Failures', 'AU-2, AU-9', 'A.8.12, A.8.15', 6.5, 'resolved', 'server/index.js', 'Removed startup full-table dumps of profiles/children and redacted reset links from logs.', 'Startup logs contain only operational metrics with zero PII.'),
('SEC-13', 'Unauthenticated Cloud Print Queue Snooping & Flooding', 'medium', 'Access Control', 'A01:2021 - Broken Access Control', 'AC-3, SC-5', 'A.8.20', 6.3, 'resolved', 'server/index.js (/api/print-jobs)', 'Protected print queue polling and job queuing with authentication.', 'Polling print jobs without authentication returns 401.'),
('SEC-14', 'Excessive Database Error and Stack Trace Leakage', 'medium', 'Error Handling', 'A05:2021 - Security Misconfiguration', 'SI-11', 'A.8.28', 5.3, 'resolved', 'server/index.js', 'Standardized error responses to return generic error messages to clients while logging details securely.', 'API errors return sanitized error messages without internal SQL details.'),
('SEC-15', 'Insecure Fallback Token in Client (kiddochecker-guest-token)', 'medium', 'Authentication', 'A07:2021 - Identification & Auth Failures', 'IA-2, IA-8', 'A.8.24', 5.8, 'resolved', 'src/lib/apiClient.ts', 'Removed hardcoded guest token fallback; unauthenticated requests fail gracefully to login.', 'Client enforces valid authenticated session tokens.'),
('SEC-16', 'Outdated Dependency with Known Vulnerabilities (xlsx 0.18.5)', 'low', 'Vulnerable Components', 'A06:2021 - Vulnerable Components', 'SI-2', 'A.8.19', 4.8, 'open', 'package.json, server/package.json', 'Scheduled migration to secure spreadsheet parsers.', 'Dependency scanner tracks package versions.'),
('SEC-17', 'Missing Hardened CSP & Security Headers', 'low', 'Security Headers', 'A05:2021 - Security Misconfiguration', 'SC-7, SC-8', 'A.8.20', 4.2, 'resolved', 'server/index.js (helmet)', 'Configured Helmet with tuned Content-Security-Policy and HSTS headers.', 'HTTP response headers contain Strict-Transport-Security and X-Content-Type-Options.'),
('SEC-18', 'Kiosk IP Physical Network Lockdown Bypass (Header Spoofing & Fail-Open)', 'critical', 'Physical Security / Auth', 'A07:2021 - Identification & Auth Failures', 'AC-3, IA-2', 'A.5.15, A.8.20', 9.0, 'resolved', 'server/index.js (checkIpAuthorized)', 'Enforced trusted proxy validation and strict fail-closed policy on IP checks.', 'Spoofed X-Forwarded-For headers are ignored; failures reject access.'),
('SEC-19', 'Third-Party MFA Secret Exfiltration via External QR Code Generator', 'critical', 'Cryptographic Failures', 'A02:2021 - Cryptographic Failures', 'IA-5, SC-28', 'A.8.24', 9.2, 'resolved', 'server/index.js (/api/auth/mfa/enroll)', 'Installed qrcode library to generate TOTP QR codes locally in-memory without external HTTP calls.', 'MFA enrollment generates local data:image/png URI without external network calls.'),
('SEC-20', 'Admin Password Reset & Bulk Action Lack Role Authorization Checks', 'critical', 'Broken Access Control', 'A01:2021 - Broken Access Control', 'AC-3, AC-6', 'A.5.15, A.8.2', 9.8, 'resolved', 'server/index.js (/api/admin/users/*)', 'Enforced requireRole(admin, super_admin) on user management and password resets.', 'Non-admin callers receive 403 Forbidden on admin endpoints.'),
('SEC-21', 'PostgreSQL SECURITY DEFINER Search-Path Hijacking', 'high', 'Database Security', 'A03:2021 - Injection', 'AC-6, SI-10', 'A.8.28', 7.8, 'resolved', 'server/master_schema.sql', 'Added SET search_path = public, pg_temp to SECURITY DEFINER functions.', 'Function execution is isolated from schema search path hijacking.'),
('SEC-22', 'Remote Print Proxy LAN SSRF & Port Scanning', 'high', 'Network Security', 'A10:2021 - SSRF', 'SC-7, AC-3', 'A.8.20', 7.5, 'resolved', 'scripts/print-proxy.cjs', 'Bound print daemon to localhost by default and removed wildcard CORS.', 'Print proxy rejects unauthorized external cross-origin requests.'),
('SEC-23', 'Audit Trail Integrity & Actor Accountability Gaps', 'medium', 'Audit & Logging', 'A09:2021 - Logging & Monitoring Failures', 'AU-2, AU-3', 'A.8.15', 6.8, 'resolved', 'server/index.js, master_schema.sql', 'Updated log_sensitive_access to record actor user_id, client IP, and tenant ID.', 'Access logs record complete actor attribution.')
ON CONFLICT (vuln_code) DO UPDATE SET
  title = EXCLUDED.title,
  severity = EXCLUDED.severity,
  category = EXCLUDED.category,
  owasp_category = EXCLUDED.owasp_category,
  nist_control = EXCLUDED.nist_control,
  iso_control = EXCLUDED.iso_control,
  cvss_score = EXCLUDED.cvss_score,
  status = EXCLUDED.status,
  affected_component = EXCLUDED.affected_component,
  remediation_details = EXCLUDED.remediation_details,
  verification_test = EXCLUDED.verification_test,
  updated_at = NOW();
