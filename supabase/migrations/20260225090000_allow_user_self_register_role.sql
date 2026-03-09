
-- Migration: Allow Users to Self-Insert Their First Role
-- Date: 2026-02-25
-- 
-- Context: The client-side AuthContext attempts to insert a default 'parent' role 
-- when a newly authenticated user has no row in user_roles. 
-- The handle_new_user trigger usually handles this, but it can fail or  
-- race conditions can occur. This migration adds a safe INSERT-only 
-- policy so a user can create their own record on the client side as a fallback, 
-- BUT only for the 'parent' role and only for their own user_id.

-- Only applies on INSERT; users cannot change their own role via this path.
DROP POLICY IF EXISTS "Users can insert their own initial role" ON public.user_roles;
CREATE POLICY "Users can insert their own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert a row for themselves
  user_id = auth.uid()
  -- And only as a 'parent' role (not admin/staff escalation)
  AND role = 'parent'::app_role
  AND is_super_admin = false
  -- And only if they don't already have a role (prevents re-insertion)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);
