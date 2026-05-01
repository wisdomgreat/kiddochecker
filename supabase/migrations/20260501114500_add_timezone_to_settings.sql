
-- Migration: Add timezone to organization settings
-- Description: Enables persistence of the organization's preferred timezone for reporting and scheduling.

ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Update existing records if any
UPDATE public.organization_settings SET timezone = 'America/New_York' WHERE timezone IS NULL;

-- Helper to get org timezone
CREATE OR REPLACE FUNCTION public.get_org_timezone()
RETURNS TEXT AS $$
    SELECT COALESCE(timezone, 'America/New_York') FROM public.organization_settings LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper to get today's date in org timezone
CREATE OR REPLACE FUNCTION public.get_org_today()
RETURNS DATE AS $$
    SELECT (NOW() AT TIME ZONE public.get_org_timezone())::DATE;
$$ LANGUAGE sql STABLE;

-- Redefine checkin_child to use the org's timezone
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_device_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attendance_id uuid;
  today_date date := public.get_org_today();
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
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id AND qr_data = p_qr_token AND is_active = true
  ) THEN
    is_authorized := true;
  ELSIF public.check_kiosk_authorized(p_device_id, caller_id) THEN
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_org_timezone() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_child(uuid, uuid, uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_report(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_liability_audit_report(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_detailed_attendance_report(date, date) TO authenticated;

