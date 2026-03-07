
-- Migration: Secure Attendance RPC Functions and QR Tokens
-- Date: 2026-02-25

-- 1. Ensure qr_codes has a secure structure (already exists, but let's make sure it's used correctly)
-- The existing useQRCodes.ts inserts `child:id:timestamp` into qr_data.
-- We will change this to a secure token in the frontend, but we need the database to verify it.

-- 2. Update checkin_child with authorization
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
  -- 1. Authorization Check
  -- Check if caller is admin/staff/teacher
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  -- Check if caller is the parent
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  -- Check if a valid QR token is provided
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

  -- 2. Existence Check
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND attendance_date = today_date 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in today';
  END IF;

  -- 3. Insert record
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

-- 3. Update checkout_child with authorization
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
  -- Get child_id from attendance record
  SELECT child_id INTO v_child_id
  FROM attendance
  WHERE id = p_attendance_id;

  IF v_child_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Authorization Check
  -- Check if caller is admin/staff/teacher
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  -- Check if caller is the parent
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  -- Check if a valid QR token is provided (matching the child)
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

  -- 2. Update record
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
