-- =============================================================
-- Migration: Security Groups & Role Hardening
-- Description: Introduces Security Groups, enforces class isolation for teachers,
--              and restricts manual check-ins to physical kiosks for staff.
-- =============================================================

-- ── 1. Create Security Groups Table ──
CREATE TABLE IF NOT EXISTS public.security_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2. Create Group Permissions Join Table ──
CREATE TABLE IF NOT EXISTS public.group_permissions (
    group_id UUID REFERENCES public.security_groups(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, permission_id)
);

-- ── 3. Create User Groups Join Table ──
CREATE TABLE IF NOT EXISTS public.user_security_groups (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.security_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- ── 4. Enable RLS on new tables ──
ALTER TABLE public.security_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_groups ENABLE ROW LEVEL SECURITY;

-- ── 5. Define Security Policies for Groups ──
DROP POLICY IF EXISTS "Admins manage security groups" ON public.security_groups;
CREATE POLICY "Admins manage security groups" ON public.security_groups 
FOR ALL TO authenticated USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Authenticated users view security groups" ON public.security_groups;
CREATE POLICY "Authenticated users view security groups" ON public.security_groups 
FOR SELECT TO authenticated USING (true);

-- ── 6. Seed Granular Permissions ──
INSERT INTO public.permissions (name, description, category) VALUES
('checkin.manual_dashboard', 'Perform check-ins without a physical kiosk device', 'attendance'),
('congregation.view_all', 'View the entire church/center roster', 'profiles'),
('staff.public_manager', 'Visible to all parents for escalation/support', 'profiles'),
('audit.view_forensics', 'Access security logs and forensic logs', 'security'),
('staff.manage_schedules', 'Create and edit roster templates', 'management')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- ── 7. Seed Standard Security Groups ──
INSERT INTO public.security_groups (name, description) VALUES
('Congregation Viewers', 'Users in this group can see the full church roster.'),
('Forensic Auditors', 'Users in this group can access forensic security logs.'),
('Shift Managers', 'Users in this group can manage staff schedules and rosters.')
ON CONFLICT (name) DO NOTHING;

-- ── 8. Redefine check_user_permission to include Groups ──
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean := false;
  v_has_permission boolean := false;
BEGIN
  -- 1. SuperAdmin Bypass
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- 2. Check Custom Role Permissions
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;

  IF v_has_permission THEN RETURN true; END IF;

  -- 3. Check Security Group Permissions
  SELECT EXISTS(
    SELECT 1
    FROM public.user_security_groups usg
    JOIN public.group_permissions gp ON usg.group_id = gp.group_id
    JOIN public.permissions p ON gp.permission_id = p.id
    WHERE usg.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- ── 9. Harden RLS: profiles (Congregation & Staff Visibility) ──
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  -- 1. Always see your own profile
  id = auth.uid()
  -- 2. Explicit Permission (Admins/Managers)
  OR public.check_user_permission(auth.uid(), 'congregation.view_all')
  OR public.is_admin_secure()
  -- 3. Parent "Need-to-Know" Visibility
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = profiles.id 
      AND (
        -- Parents see staff assigned to their children's classes
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.children c ON t.class_id = c.class_id
            WHERE t.user_id = profiles.id AND c.parent_id = auth.uid()
        )
        -- Parents see Public Managers for escalation
        OR public.check_user_permission(profiles.id, 'staff.public_manager')
      )
    )
  )
);

-- Ensure user_roles visibility follows the same logic to prevent RLS bypass via role-checks
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view staff roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR public.is_admin_secure()
  OR (
    -- Parent viewing staff of their child's class
    EXISTS (
        SELECT 1 FROM public.teachers t
        JOIN public.children c ON t.class_id = c.class_id
        WHERE t.user_id = user_roles.user_id AND c.parent_id = auth.uid()
    )
    -- Parent viewing public managers
    OR public.check_user_permission(user_roles.user_id, 'staff.public_manager')
  )
);

-- ── 10. Harden check-in/out functions (Kiosk Enforcement) ──
-- Note: This requires the application to pass a device_id.
-- We update the logic to check if the caller has manual dashboard permission.

CREATE OR REPLACE FUNCTION public.check_kiosk_authorized(p_device_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Admins/SuperAdmins can check in from anywhere
    IF public.is_admin_secure() THEN
        RETURN true;
    END IF;

    -- If user has manual dashboard permission, bypass device check
    IF public.check_user_permission(p_user_id, 'checkin.manual_dashboard') THEN
        RETURN true;
    END IF;

    -- Otherwise, must be from a registered kiosk device
    RETURN EXISTS (
        SELECT 1 FROM public.enrolled_devices
        WHERE id = p_device_id
        AND type = 'kiosk'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 11. Final Role Hardening: Teacher Class Isolation ──
-- Ensure teachers can only see classes they are assigned to.
DROP POLICY IF EXISTS "classes_staff_view_assigned" ON public.classes;
CREATE POLICY "classes_staff_view_assigned"
ON public.classes FOR SELECT TO authenticated
USING (
    public.is_admin_secure()
    OR id IN (
        SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "children_staff_assigned_select" ON public.children;
CREATE POLICY "children_staff_assigned_select"
ON public.children FOR SELECT TO authenticated
USING (
    public.is_admin_secure()
    OR (
        class_id IN (SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid())
    )
);

-- ── 12. Redefine checkin/checkout with Kiosk Enforcement ──
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_device_id uuid DEFAULT NULL -- NEW: Physical hardware ID
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check (Role + Security Groups)
  IF public.is_admin_secure() THEN
    is_authorized := true;
  ELSIF public.check_user_permission(caller_id, 'checkin.manual_dashboard') THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    -- Parents always authorized for their own kids
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id AND qr_data = p_qr_token AND is_active = true
  ) THEN
    -- Valid QR code bypass
    is_authorized := true;
  ELSIF public.check_kiosk_authorized(p_device_id, caller_id) THEN
    -- Request is coming from a verified physical kiosk
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: Check-in must be performed from an authorized kiosk device.';
  END IF;

  -- 2. Insert record
  INSERT INTO attendance (
    child_id, class_id, checked_in_at, checked_in_by, 
    attendance_date, checked_in_method, checked_in_station
  )
  VALUES (
    p_child_id, p_class_id, NOW(), COALESCE(p_checked_in_by, caller_id),
    today_date, p_method, COALESCE(p_station, p_device_id::text)
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$$;

DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_device_id uuid DEFAULT NULL -- NEW: Physical hardware ID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  SELECT child_id INTO v_child_id FROM attendance WHERE id = p_attendance_id;
  IF v_child_id IS NULL THEN RETURN false; END IF;

  -- 1. Authorization Check
  IF public.is_admin_secure() THEN
    is_authorized := true;
  ELSIF public.check_user_permission(caller_id, 'checkin.manual_dashboard') THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes WHERE child_id = v_child_id AND qr_data = p_qr_token AND is_active = true
  ) THEN
    is_authorized := true;
  ELSIF public.check_kiosk_authorized(p_device_id, caller_id) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: Check-out must be performed from an authorized kiosk device.';
  END IF;

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = COALESCE(p_station, p_device_id::text)
  WHERE id = p_attendance_id AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$$;

-- ── 13. Governance: Four-Eyes Approval System ──
CREATE TABLE IF NOT EXISTS public.pending_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    action_data JSONB NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage approvals" ON public.pending_approvals 
FOR ALL USING (public.is_admin_secure());

-- ── 14. Accountability: Read-Access Logging (Transparency) ──
CREATE TABLE IF NOT EXISTS public.data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    resource_type TEXT NOT NULL, -- e.g., 'child_medical_notes', 'forensic_report'
    resource_id UUID,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB -- IP, device info, etc.
);

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view access logs" ON public.data_access_logs 
FOR SELECT USING (public.is_admin_secure());

CREATE OR REPLACE FUNCTION public.log_sensitive_access(p_resource_type text, p_resource_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.data_access_logs (user_id, resource_type, resource_id)
    VALUES (auth.uid(), p_resource_type, p_resource_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 15. Integrity: Report Sealing ──
CREATE TABLE IF NOT EXISTS public.report_seals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    report_hash TEXT NOT NULL, -- SHA-256
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.report_seals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can verify seals" ON public.report_seals 
FOR SELECT USING (true);
