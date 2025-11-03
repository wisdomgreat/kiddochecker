-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_bypass" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;

-- Create safe policies using security definer functions
-- Users can always read their own role (no recursion)
CREATE POLICY "users_read_own_role_safe"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Super admins can manage all roles (using security definer function)
CREATE POLICY "super_admins_manage_roles_safe"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_super_admin_secure())
WITH CHECK (is_super_admin_secure());

-- Service role has full access
CREATE POLICY "service_role_full_access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);