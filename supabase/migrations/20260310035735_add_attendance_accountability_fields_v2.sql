
-- Add accountability fields to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS checked_in_method TEXT,
ADD COLUMN IF NOT EXISTS checked_out_method TEXT,
ADD COLUMN IF NOT EXISTS checked_in_station TEXT,
ADD COLUMN IF NOT EXISTS checked_out_station TEXT;

-- Drop existing functions before recreation because signatures are changing
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_liability_audit_report(date, date);

-- Redefine checkin_child with accountability parameters
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL
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
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
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

  -- 2. Existence Check (Check if already checked in and NOT checked out)
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

-- Redefine checkout_child with accountability parameters
CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL
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
  SELECT child_id INTO v_child_id FROM attendance WHERE id = p_attendance_id;
  IF v_child_id IS NULL THEN RETURN false; END IF;

  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
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

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = p_station
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;

-- Update the Liability Audit Report to return these new fields and roles
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    child_age INTEGER,
    has_allergies BOOLEAN,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_in_by_role TEXT,
    checked_in_method TEXT,
    checked_in_station TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    checked_out_by_role TEXT,
    checked_out_method TEXT,
    checked_out_station TEXT,
    duration_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        ch.age as child_age,
        (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role,
        a.checked_in_method,
        a.checked_in_station,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role,
        a.checked_out_method,
        a.checked_out_station,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;
