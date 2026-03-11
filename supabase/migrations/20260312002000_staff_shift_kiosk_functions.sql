-- Migration: add_staff_shift_kiosk_functions
-- Add functions for staff to check in/out of shifts from kiosk

CREATE OR REPLACE FUNCTION public.get_staff_shifts_for_kiosk(p_pin text)
RETURNS TABLE (
  shift_id uuid,
  staff_id uuid,
  staff_name text,
  start_time timestamptz,
  end_time timestamptz,
  role_type text,
  status text,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  class_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_staff_name text;
BEGIN
  -- Verify the staff PIN
  SELECT p.id, p.first_name || ' ' || p.last_name INTO v_staff_id, v_staff_name
  FROM public.profiles p
  WHERE p.staff_pin = p_pin;

  IF v_staff_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    s.id as shift_id,
    s.staff_id,
    v_staff_name as staff_name,
    s.start_time,
    s.end_time,
    s.role_type,
    s.status,
    s.actual_start_time,
    s.actual_end_time,
    c.name as class_name
  FROM public.shifts s
  LEFT JOIN public.classes c ON s.class_id = c.id
  WHERE s.staff_id = v_staff_id
    AND s.start_time::date = current_date
  ORDER BY s.start_time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_shifts_for_kiosk(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.staff_shift_action_kiosk(p_shift_id uuid, p_action text, p_kiosk_id text DEFAULT 'primary-kiosk')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift_status text;
BEGIN
  SELECT status INTO v_shift_status FROM public.shifts WHERE id = p_shift_id;
  
  IF v_shift_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shift not found');
  END IF;

  IF p_action = 'check_in' THEN
    UPDATE public.shifts 
    SET 
      actual_start_time = now(),
      status = 'confirmed',
      kiosk_id = p_kiosk_id
    WHERE id = p_shift_id;
    RETURN jsonb_build_object('success', true, 'action', 'checked_in');
  ELSIF p_action = 'check_out' THEN
    UPDATE public.shifts 
    SET 
      actual_end_time = now(),
      status = 'completed'
    WHERE id = p_shift_id;
    RETURN jsonb_build_object('success', true, 'action', 'checked_out');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_shift_action_kiosk(uuid, text, text) TO anon, authenticated;
