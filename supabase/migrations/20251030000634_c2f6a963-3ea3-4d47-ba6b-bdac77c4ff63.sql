-- Fix remaining security warnings from linter

-- Fix 1: Add search_path to create_user_role functions (both overloaded versions)
CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id uuid, p_role app_role DEFAULT 'parent'::app_role, p_is_super_admin boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_role_id UUID;
BEGIN
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_super_admin
  )
  VALUES (
    p_user_id,
    p_role,
    p_is_super_admin
  )
  RETURNING id INTO new_role_id;
  
  RETURN new_role_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id uuid, p_role app_role DEFAULT 'parent'::app_role, p_is_super_admin boolean DEFAULT false, p_is_volunteer boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_role_id UUID;
BEGIN
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_super_admin,
    is_volunteer
  )
  VALUES (
    p_user_id,
    p_role,
    p_is_super_admin,
    p_is_volunteer
  )
  RETURNING id INTO new_role_id;
  
  RETURN new_role_id;
END;
$function$;

-- Fix 2: Drop and recreate auth_users_with_emails view without SECURITY DEFINER
-- This view should only be accessible to users with proper permissions through RLS
DROP VIEW IF EXISTS public.auth_users_with_emails CASCADE;

-- Create a secure function instead of a view to access user emails
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Only allow admins or the user themselves to get email
  IF NOT (public.is_admin_secure() OR auth.uid() = p_user_id) THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN user_email;
END;
$function$;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_user_email IS 'Securely retrieves user email. Only accessible by admins or the user themselves.';