# Security & Access Control Model

KiddoChecker is built on a **"Deny-All"** security philosophy. No user has access to data unless explicitly granted by a Role, Security Group, or Relationship (RLS).

## 1. Hardware-Bound Kiosks
The system prevents "Remote Check-ins" to ensure children are physically present.
- **`deviceId` Injection**: Every check-in/out call must include a unique hardware ID.
- **Validation**: The `public.check_kiosk_authorized()` RPC validates the device against `enrolled_devices`.
- **Exception**: Admins and users in the `Dashboard Manual Check-in` security group can bypass this for administrative overrides.

## 2. Hybrid Authorization (RBAC + GBAC)
We combine standard roles with additive security groups.

### Base Roles (RBAC)
- **Super Admin**: Full system control.
- **Admin**: Organizational control.
- **Staff**: General operational access.
- **Teacher**: Classroom-specific access.
- **Parent**: Family-only access.

### Security Groups (GBAC)
Additive privileges granted to users regardless of role:
- **Forensic Auditors**: Permission `audit.view_forensics`
- **Dashboard Manual Check-in**: Permission `checkin.manual_dashboard`
- **Congregation Viewers**: Permission `congregation.view_all`

## 3. Row Level Security (RLS)
The database enforces isolation at the row level.

### Teacher Isolation
Teachers can **only** see children and attendance logs for classes they are assigned to in the `teachers` table.
```sql
CREATE POLICY "Teacher Isolation" ON children
FOR SELECT USING (
  class_id IN (SELECT class_id FROM teachers WHERE user_id = auth.uid())
);
```

### Parent Privacy
Parents are restricted to viewing only their own children and their own profile.

## 4. Forensic Auditing
### Sensitive Data Access
Whenever a staff member views sensitive information (like medical notes), the system automatically triggers `public.log_sensitive_access()`. This creates an immutable record in `data_access_logs`.

### Cryptographic Sealing
To ensure legal compliance and tamper-proofing, reports can be "Sealed".
1. A SHA-256 hash is generated for the report data.
2. The hash is signed and stored in `report_seals`.
3. Any future verification can re-hash the data to ensure it hasn't been altered.

## 5. Security Protocols
- **API Access**: All data mutations are funneled through `SECURITY DEFINER` RPCs to prevent direct table manipulation.
- **MFA**: Support for banking-grade authentication factors.
- **Rate Limiting**: Enforced at the Supabase/PostgreSQL level for PIN attempts and logins.
