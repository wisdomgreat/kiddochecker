-- Batch 1A: Database Security & Performance Fixes

-- Fix 1: Add search_path to has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF user_id = auth.uid() THEN
    RETURN public.has_role_secure(role);
  END IF;
  
  IF NOT public.is_admin_secure() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id
    AND (ur.role = has_role.role OR (has_role.role = 'admin' AND ur.is_super_admin = true))
  );
END;
$function$;

-- Fix 2: Add search_path to get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.get_current_user_role_secure();
$function$;

-- Fix 3: Add search_path to is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.is_admin_secure();
$function$;

-- Tighten RLS: organization_settings - restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read organization settings" ON public.organization_settings;
CREATE POLICY "Authenticated users can read organization settings"
ON public.organization_settings
FOR SELECT
TO authenticated
USING (true);

-- Tighten RLS: device_profiles - ensure only admins can write
DROP POLICY IF EXISTS "Device profiles are accessible to all authenticated users" ON public.device_profiles;
CREATE POLICY "Authenticated users can read device profiles"
ON public.device_profiles
FOR SELECT
TO authenticated
USING (true);

-- Tighten RLS: classes - keep read public for authenticated, restrict write
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "Authenticated users can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- Tighten RLS: teachers - keep read for authenticated, admin write only
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;
CREATE POLICY "Authenticated users can view teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);