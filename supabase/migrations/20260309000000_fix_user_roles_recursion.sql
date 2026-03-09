
-- Migration: Fix RLS Recursion on user_roles
-- Date: 2026-03-09

-- 1. Drop old policies
DROP POLICY IF EXISTS "users_view_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 2. Create clean, non-recursive policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Base CASE: Users can always see THEIR OWN role (needed for all permission checks)
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can also see everyone's role
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  -- Use a subquery that specifically only looks at the user's OWN row to break recursion
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
);

-- Admins can manage all roles
CREATE POLICY "admins_manage_all_roles_final"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
);

-- 3. Debug function (keep it for now)
CREATE OR REPLACE FUNCTION public.debug_check_user_roles(p_user_id uuid)
RETURNS TABLE(user_id uuid, role text, is_super_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT ur.user_id, ur.role::text, ur.is_super_admin 
               FROM public.user_roles ur 
               WHERE ur.user_id = p_user_id;
END;
$$;
