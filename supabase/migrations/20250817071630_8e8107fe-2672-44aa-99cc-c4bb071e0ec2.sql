
-- Phase 1: Fix Critical Database Issues

-- First, let's fix the get_users_with_roles function that's causing the Edge Function to fail
-- The error shows "structure of query does not match function result type"
-- This suggests column type mismatches

DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_super_admin boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      (au.email_confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name, p.first_name;
END;
$function$;

-- Create missing database functions for check-in/check-out operations
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
BEGIN
  -- Check if child is already checked in today
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND attendance_date = today_date 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in today';
  END IF;

  -- Insert new attendance record
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
    COALESCE(p_checked_in_by, auth.uid()),
    today_date
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update attendance record with checkout time
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, auth.uid())
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;

-- Create function to get today's attendance for kiosk displays
CREATE OR REPLACE FUNCTION public.get_todays_attendance()
RETURNS TABLE(
  attendance_id uuid,
  child_id uuid,
  child_name text,
  class_name text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  is_present boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      a.id as attendance_id,
      a.child_id,
      CONCAT(c.first_name, ' ', c.last_name) as child_name,
      COALESCE(cl.name, 'No Class') as class_name,
      a.checked_in_at,
      a.checked_out_at,
      (a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL) as is_present
    FROM attendance a
    JOIN children c ON a.child_id = c.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    WHERE a.attendance_date = CURRENT_DATE
    ORDER BY a.checked_in_at DESC;
END;
$function$;

-- Fix RLS policies to prevent conflicts
-- Drop conflicting policies on user_roles table
DROP POLICY IF EXISTS "admins_manage_all_roles_secure" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role_secure" ON public.user_roles;

-- Create clean RLS policies
CREATE POLICY "service_role_bypass" ON public.user_roles
  FOR ALL USING (
    CASE
      WHEN (auth.jwt() ->> 'role'::text) = 'service_role'::text THEN true
      ELSE false
    END
  );

CREATE POLICY "users_read_own_role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_manage_roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid()
      AND (ur2.role = 'super_admin'::app_role OR ur2.is_super_admin = true)
    )
  );
