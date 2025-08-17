
-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_bypass" ON public.user_roles;

-- Create a security definer function to get current user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Create a security definer function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  );
$$;

-- Create new non-recursive policies for user_roles table
CREATE POLICY "users_read_own_role_safe" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles_safe" 
ON public.user_roles 
FOR ALL 
USING (
  CASE 
    WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles ur2 
      WHERE ur2.user_id = auth.uid() 
      AND (ur2.role = 'admin' OR ur2.role = 'super_admin' OR ur2.is_super_admin = true)
      AND ur2.id != user_roles.id
    )
  END
);

-- Update other problematic policies to use the safe functions
DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.profiles;
CREATE POLICY "admins_manage_all_profiles_safe" 
ON public.profiles 
FOR ALL 
USING (id = auth.uid() OR public.is_admin_user_safe());

-- Update the get_current_user_role function to use the safe version
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'parent'::app_role
  );
$$;

-- Ensure the handle_new_user trigger creates proper default roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Only assign default role if not organization creator
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
