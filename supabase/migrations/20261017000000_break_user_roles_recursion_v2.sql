
-- 🛡️ Security Seal: Final Recursion Breaker
-- Migration: 20261017000000_break_user_roles_recursion_v2.sql
-- Description: Replaces table-lookup based admin checks with JWT-based checks to prevent infinite recursion in RLS policies.

-- 1. Optimized Non-Recursive Admin Check
-- This function uses the JWT metadata instead of querying the user_roles table, 
-- preventing the infinite recursion that happens when a policy on user_roles calls this function.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check JWT metadata first (fastest, no recursion)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- Fallback: Use a direct SQL query that avoids triggering RLS on itself if possible,
  -- but in most cases, the JWT check is sufficient for RLS policies.
  -- For service_role/postgres, always return true for security definer context if needed.
  IF (SELECT current_setting('role')) IN ('postgres', 'service_role') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 2. Clean up user_roles policies
DROP POLICY IF EXISTS "users_view_own_role_final" ON public.user_roles;
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_roles_final" ON public.user_roles;
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  -- Use the non-recursive check
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);

-- 3. Fix the Attendance policy as well, just in case
DROP POLICY IF EXISTS "attendance_parent_own" ON public.attendance;
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT TO authenticated
    USING (
      -- Direct check to avoid any nested function calls if possible
      EXISTS (
        SELECT 1 FROM public.children
        WHERE id = child_id AND parent_id = auth.uid()
      )
      OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );
