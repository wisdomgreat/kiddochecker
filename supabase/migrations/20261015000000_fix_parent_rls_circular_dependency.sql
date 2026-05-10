
-- 🛡️ Security Seal: Parent Ownership Verification
-- Migration: 20261015000000_fix_parent_rls_circular_dependency.sql
-- Description: Adds a SECURITY DEFINER helper to verify child ownership and updates RLS policies to resolve circular dependencies.

-- 1. Helper: Secure Child Ownership Check
-- This function bypasses RLS on the children table to allow verification in policies.
CREATE OR REPLACE FUNCTION public.is_parent_of_child(p_child_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.children
    WHERE id = p_child_id AND parent_id = auth.uid()
  );
END;
$$;

-- 2. Update Attendance Policy
-- Replace the subquery-based policy with the secure function call.
DROP POLICY IF EXISTS "attendance_parent_own" ON public.attendance;
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT TO authenticated
    USING (public.is_parent_of_child(child_id));

-- 3. Update Children Policy (Self-Verification)
-- While the existing policy (parent_id = auth.uid()) should work, 
-- using a SECURITY DEFINER helper can sometimes resolve permission inheritance issues.
-- However, we'll keep the children one as is for now unless it fails.

-- 4. Grant Execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_parent_of_child(uuid) TO authenticated;
