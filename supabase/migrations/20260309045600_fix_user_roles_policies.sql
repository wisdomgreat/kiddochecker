
-- Migration: Fix policies infinite recursion for good
-- Date: 2026-03-09

-- 1. Drop ALL potentially recursive policies
DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

DROP POLICY IF EXISTS "users_view_own_role_final" ON public.user_roles;
DROP POLICY IF EXISTS "admins_view_all_roles_final" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_all_roles_final" ON public.user_roles;

-- 2. Create the exact three minimal policies using SECURITY DEFINER function to prevent recursion

-- Base CASE: Users can always see THEIR OWN role
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can also see everyone's role using the secure function
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- Admins can manage all roles using the secure function
CREATE POLICY "admins_manage_all_roles_final"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());
