
-- Migration: Grant kiosk role SELECT access to children, classes, attendance, qr_codes
-- The kiosk device user needs to search children, view classes, and process check-ins.
-- Without this, the kiosk terminal shows 0 results on all searches.

-- 1. CHILDREN: Allow kiosk to SELECT children
DROP POLICY IF EXISTS "authenticated_view_children" ON public.children;
CREATE POLICY "authenticated_view_children"
ON public.children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
  OR has_role_secure('teacher'::app_role)
  OR has_role_secure('teacher_assistant'::app_role)
  OR has_role_secure('kiosk'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.child_id = id AND pc.parent_id = auth.uid()
  )
);

-- 2. CLASSES: Allow kiosk to SELECT classes
DROP POLICY IF EXISTS "kiosk_view_classes" ON public.classes;
CREATE POLICY "kiosk_view_classes"
ON public.classes FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 3. ATTENDANCE: Allow kiosk to SELECT and INSERT attendance (for check-in/check-out)
DROP POLICY IF EXISTS "kiosk_view_attendance" ON public.attendance;
CREATE POLICY "kiosk_view_attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

DROP POLICY IF EXISTS "kiosk_insert_attendance" ON public.attendance;
CREATE POLICY "kiosk_insert_attendance"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (has_role_secure('kiosk'::app_role));

-- 4. QR_CODES: Allow kiosk to SELECT qr_codes (needed for QR scan check-in)
DROP POLICY IF EXISTS "kiosk_view_qr_codes" ON public.qr_codes;
CREATE POLICY "kiosk_view_qr_codes"
ON public.qr_codes FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 5. KIOSK_SETTINGS: Already has public read policy, but ensure kiosk can read
DROP POLICY IF EXISTS "kiosk_read_settings" ON public.kiosk_settings;
CREATE POLICY "kiosk_read_settings"
ON public.kiosk_settings FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 6. PROFILES: Allow kiosk to read profiles (for parent PIN lookup)
DROP POLICY IF EXISTS "kiosk_view_profiles" ON public.profiles;
CREATE POLICY "kiosk_view_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 7. Update checkin_child and checkout_child to also authorize kiosk role
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = caller_id
    AND role IN ('admin', 'super_admin', 'staff', 'teacher', 'kiosk')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id
    AND qr_data = p_qr_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  IF EXISTS (
    SELECT 1 FROM attendance
    WHERE child_id = p_child_id
    AND attendance_date = today_date
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in today';
  END IF;

  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  SELECT child_id INTO v_child_id
  FROM attendance
  WHERE id = p_attendance_id;

  IF v_child_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = caller_id
    AND role IN ('admin', 'super_admin', 'staff', 'teacher', 'kiosk')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = v_child_id
    AND qr_data = p_qr_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check out this child';
  END IF;

  UPDATE attendance
  SET
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id)
  WHERE
    id = p_attendance_id
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;
