
-- Migration: Fix Infinite Recursion in user_roles
-- Description: Removes recursive policies and optimizes admin checks.

-- 1. Nuke the recursive policy added today
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;

-- 2. Revert is_admin_secure to LANGUAGE sql (more reliable for recursion bypass in some Postgres versions)
-- and ensure it's owned by postgres to bypass RLS.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  );
$$;

-- 3. Ensure the base policies for user_roles are clean
DROP POLICY IF EXISTS "users_view_own_role_final" ON public.user_roles;
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_roles_final" ON public.user_roles;
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- 4. Fix profiles recursion as well (just in case)
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  id = auth.uid()
  OR public.is_admin_secure()
  OR EXISTS (
    -- Direct check instead of calling another function that might query profiles
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND (
      -- Parent visibility check (non-recursive)
      EXISTS (
          SELECT 1 FROM public.teachers t
          JOIN public.children c ON t.class_id = c.class_id
          WHERE t.user_id = profiles.id AND c.parent_id = auth.uid()
      )
    )
  )
);
