-- 🛡️ Phase 3: Security Hardening & RLS Audit
-- Migration: 20261011000000_security_hardening_audit.sql
-- Description: Fixes privilege escalation, secures org promotion, and adds missing auth checks to RPCs.

-- 1. Helper: MFA Awareness
CREATE OR REPLACE FUNCTION public.is_mfa_authenticated()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if Authenticator Assurance Level is 2 (MFA completed)
  RETURN (SELECT COALESCE(auth.jwt() ->> 'aal', '') = 'aal2');
END;
$$;

-- 2. Helper: Consolidated Admin Check
-- This centralizes admin detection and ensures it's SECURITY DEFINER to bypass RLS for checks.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  );
END;
$$;

-- 3. Fix handle_new_user() trigger to prevent self-promotion
-- Prevents users from passing 'admin' or 'super_admin' in metadata to get elevated roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role app_role;
  v_meta_role text;
BEGIN
  v_meta_role := NEW.raw_user_meta_data->>'target_role';
  
  -- Whitelist roles that can be self-assigned.
  -- 'admin' and 'super_admin' are EXPLICITLY forbidden to be self-assigned via metadata.
  IF v_meta_role IN ('parent', 'kiosk') THEN
    v_role := v_meta_role::app_role;
  ELSE
    v_role := 'parent'::app_role;
  END IF;

  -- Kiosk devices are special
  IF (NEW.raw_user_meta_data->>'is_device')::boolean IS TRUE THEN
    v_role := 'kiosk'::app_role;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Assign role (skip if it's the org creator - they use a secure RPC)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Secure assign_organization_creator_role()
-- Only allow assigning if the organization has no creator OR if the caller is an admin.
CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_creator UUID;
BEGIN
  -- Get current creator of the org
  SELECT created_by INTO v_current_creator 
  FROM public.organization_settings 
  WHERE id = p_org_id;

  -- Security check: 
  -- Prevent "hijacking" of organizations.
  IF v_current_creator IS NOT NULL 
     AND v_current_creator != p_user_id 
     AND NOT (SELECT public.is_admin_secure()) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot hijack organization ownership.';
  END IF;

  -- Update/Insert role
  INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
  VALUES (p_user_id, 'super_admin'::app_role, true, 'verified', now())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin'::app_role,
    is_super_admin = true,
    verification_status = 'verified',
    verified_at = now();
  
  -- Link creator to org if not already linked
  UPDATE public.organization_settings
  SET created_by = p_user_id
  WHERE id = p_org_id AND created_by IS NULL;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 5. Harden RPC: get_staff_members()
-- Only staff/admins should see the staff roster.
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: Only staff or admins can view the roster.
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can view the roster.';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 6. Harden RPC: get_attendance_report()
-- Only admins/staff should see aggregate reports.
CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date)
RETURNS TABLE(
  attendance_date date,
  total_checked_in integer,
  total_checked_out integer,
  class_name text,
  class_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check
  IF NOT (SELECT public.is_admin_secure()) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'staff'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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
$$;
