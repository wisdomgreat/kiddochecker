# API & Database Functions (RPC) Reference

KiddoChecker logic is heavily concentrated in PostgreSQL functions (RPCs) to ensure atomicity and security.

## 1. Attendance & Kiosk
### `checkin_child`
- **Parameters**: `child_id`, `class_id`, `checked_in_by`, `qr_token`, `method`, `station`, `device_id`
- **Logic**: Validates kiosk authorization, permission bits, and QR tokens before creating a record.
- **Security**: `SECURITY DEFINER`, verifies `check_kiosk_authorized`.

### `checkout_child`
- **Parameters**: `attendance_id`, `checked_out_by`, `qr_token`, `method`, `station`, `device_id`
- **Logic**: Updates existing attendance record with departure metadata.

### `get_children_for_kiosk`
- **Parameters**: `search_term`
- **Logic**: Optimized lookup for children by name or phone, filtered by organization.

---

## 2. Security & Identity
### `check_user_permission`
- **Parameters**: `p_user_id`, `p_permission_name`
- **Logic**: Recursively checks Roles -> Custom Roles -> Security Groups. Returns `boolean`.

### `is_admin_secure`
- **Logic**: Returns `true` if the calling user has `admin` or `super_admin` role. Used in RLS policies.

### `log_sensitive_access`
- **Parameters**: `resource_type`, `resource_id`
- **Logic**: Creates an immutable audit entry in `data_access_logs`.

---

## 3. Staff & Scheduling
### `get_staff_members`
- **Logic**: Returns a list of all active staff with their current shifts and assignments.

### `check_in_staff_shift`
- **Parameters**: `staff_id`, `shift_id`, `device_id`
- **Logic**: Records the start of a staff shift, binding it to a terminal.

---

## 4. Church & CRM
### `get_church_analytics`
- **Logic**: Aggregates attendance, membership, and interaction data for the management dashboard.

### `track_visitor_interaction`
- **Parameters**: `profile_id`, `note`, `milestone`
- **Logic**: Updates the visitor journey and records the interaction.

---

## 5. Report Sealing
### `seal_report`
- **Parameters**: `report_name`, `report_hash`
- **Logic**: Stores a cryptographic seal for a generated data export.
