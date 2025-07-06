
-- Fix all database functions by adding proper search_path security
-- This will resolve the infinite recursion errors and security warnings

-- Update all functions with proper search_path setting
CREATE OR REPLACE FUNCTION public.get_parent_children_with_classes(parent_user_id uuid)
 RETURNS TABLE(child_id uuid, first_name text, last_name text, age integer, allergies text, current_class_name text, current_class_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as child_id,
    c.first_name,
    c.last_name,
    c.age,
    c.allergies,
    cl.name as current_class_name,
    cl.id as current_class_id
  FROM public.children c
  LEFT JOIN public.attendance a ON c.id = a.child_id 
    AND a.attendance_date = CURRENT_DATE 
    AND a.checked_out_at IS NULL
  LEFT JOIN public.classes cl ON a.class_id = cl.id
  WHERE c.parent_id = parent_user_id
  ORDER BY c.first_name, c.last_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_detailed_attendance_report(start_date date DEFAULT CURRENT_DATE, end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(attendance_date date, child_name text, class_name text, check_in_time timestamp with time zone, check_out_time timestamp with time zone, duration_hours numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.attendance_date,
    CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
    cl.name as class_name,
    a.checked_in_at as check_in_time,
    a.checked_out_at as check_out_time,
    CASE 
      WHEN a.checked_out_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
      ELSE NULL
    END as duration_hours
  FROM attendance a
  JOIN children ch ON a.child_id = ch.id
  LEFT JOIN classes cl ON a.class_id = cl.id
  WHERE a.attendance_date BETWEEN start_date AND end_date
  ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_class_roster_with_attendance(class_id_param uuid, date_param date DEFAULT CURRENT_DATE)
 RETURNS TABLE(child_id uuid, child_name text, is_present boolean, check_in_time timestamp with time zone, check_out_time timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id as child_id,
    CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
    (a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL) as is_present,
    a.checked_in_at as check_in_time,
    a.checked_out_at as check_out_time
  FROM children ch
  LEFT JOIN attendance a ON ch.id = a.child_id 
    AND a.attendance_date = date_param
    AND a.class_id = class_id_param
  ORDER BY ch.first_name, ch.last_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_events()
 RETURNS SETOF events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events
  ORDER BY start_date ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date)
 RETURNS TABLE(attendance_date date, total_checked_in integer, total_checked_out integer, class_name text, class_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      a.attendance_date,
      COUNT(a.id) FILTER (WHERE a.checked_in_at IS NOT NULL)::INTEGER as total_checked_in,
      COUNT(a.id) FILTER (WHERE a.checked_out_at IS NOT NULL)::INTEGER as total_checked_out,
      c.name as class_name,
      c.id as class_id
    FROM 
      attendance a
    LEFT JOIN 
      classes c ON a.class_id = c.id
    WHERE 
      a.attendance_date BETWEEN start_date AND end_date
    GROUP BY 
      a.attendance_date, c.name, c.id
    ORDER BY 
      a.attendance_date DESC, c.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_device(p_device_id text, p_name text, p_type text, p_location text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  INSERT INTO device_profiles (device_id, name, type, location)
  VALUES (p_device_id, p_name, p_type, p_location)
  ON CONFLICT (device_id) 
  DO UPDATE SET 
    name = p_name,
    type = p_type,
    location = COALESCE(p_location, device_profiles.location),
    updated_at = NOW()
  RETURNING to_jsonb(device_profiles.*) INTO v_result;
  
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_device_profile(p_device_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT to_jsonb(device_profiles.*)
  FROM device_profiles
  WHERE device_id = p_device_id
  INTO v_result;
  
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_sql_query_safety(query text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (query = 'SELECT id, email FROM auth_users_with_emails'
      OR query = 'SELECT id, email FROM auth_users_emails_view');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users
    JOIN user_roles ON auth.users.id = user_roles.user_id 
    WHERE auth.users.id = user_id 
    AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_upcoming_events(limit_count integer DEFAULT 10)
 RETURNS SETOF events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events
  WHERE start_date >= CURRENT_TIMESTAMP
  ORDER BY start_date ASC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_resource text, p_action text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_is_super_admin BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_roles
  WHERE user_id = p_user_id AND role = 'admin';

  IF v_is_super_admin IS TRUE THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_custom_roles ucr
    JOIN role_permissions rp ON ucr.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ucr.user_id = p_user_id
    AND p.resource = p_resource
    AND p.action = p_action
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND (user_roles.role = has_role.role OR (has_role.role = 'admin' AND user_roles.is_super_admin = true))
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_class_teacher_assignment(p_class_name text, p_description text, p_age_range text, p_capacity integer, p_room text, p_teacher_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_class_id UUID;
BEGIN
  INSERT INTO classes (
    name, 
    description,
    age_range,
    capacity,
    room
  )
  VALUES (
    p_class_name,
    p_description,
    p_age_range,
    p_capacity,
    p_room
  )
  RETURNING id INTO new_class_id;
  
  IF p_teacher_id IS NOT NULL THEN
    INSERT INTO teachers (
      user_id,
      class_id
    )
    VALUES (
      p_teacher_id,
      new_class_id
    );
  END IF;
  
  RETURN new_class_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_organization(org_name text, primary_color text DEFAULT '#6366f1'::text, font_family text DEFAULT 'Inter'::text, creator_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO organization_settings (
    name, 
    primary_color, 
    font_family, 
    created_by
  )
  VALUES (
    org_name, 
    primary_color, 
    font_family, 
    creator_id
  )
  RETURNING id INTO new_org_id;
  
  RETURN new_org_id;
END;
$function$;

-- Fix the problematic RLS policies that cause infinite recursion
-- Remove the recursive policies and replace with simpler ones

-- Drop problematic policies on user_roles table
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Create safer, non-recursive policies
CREATE POLICY "Users can view their own role only" ON user_roles
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Super admins have full access" ON user_roles
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access" ON user_roles
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Add missing QR code functionality for check-in system
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  qr_data text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on qr_codes
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for QR codes
CREATE POLICY "Staff can manage QR codes" ON qr_codes
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'teacher', 'super_admin')
  ));

CREATE POLICY "Parents can view their children's QR codes" ON qr_codes
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM children 
    WHERE children.id = qr_codes.child_id 
    AND children.parent_id = auth.uid()
  ));
