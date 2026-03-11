-- Migration: 20260312003000_add_signature_and_map_settings.sql

-- Add signature_data column to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Add new settings to organization_settings
ALTER TABLE public.organization_settings ADD COLUMN IF NOT EXISTS require_checkout_signature BOOLEAN DEFAULT false;
ALTER TABLE public.organization_settings ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT;

-- Update checkout_child RPC to handle signature
CREATE OR REPLACE FUNCTION public.checkout_child(
    p_attendance_id uuid,
    p_checked_out_by uuid DEFAULT NULL,
    p_qr_token text DEFAULT NULL,
    p_method text DEFAULT 'kiosk',
    p_station text DEFAULT 'Main Kiosk',
    p_signature_data text DEFAULT NULL
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
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = p_station,
    signature_data = p_signature_data
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;
