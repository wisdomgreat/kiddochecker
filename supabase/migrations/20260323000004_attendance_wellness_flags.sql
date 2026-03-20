-- Add wellness screening flags to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS health_screening_fever BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS health_screening_cough BOOLEAN DEFAULT FALSE;

-- Update checkin_child RPC to handle wellness flags
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL,
  p_health_fever boolean DEFAULT FALSE,
  p_health_cough boolean DEFAULT FALSE
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
    AND role IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'kiosk')
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

  -- 2. Existence Check
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
    checked_in_station,
    special_instructions,
    health_screening_fever,
    health_screening_cough
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station,
    p_special_instructions,
    p_health_fever,
    p_health_cough
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;
