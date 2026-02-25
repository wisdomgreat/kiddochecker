-- ============================================================
-- Migration: Fix RLS Recursion between children and parent_children
-- Date: 2026-02-24
-- ============================================================

-- 1. Fix parent_children policies to NOT query children table
-- This breaks the recursive loop: children -> parent_children -> children

DROP POLICY IF EXISTS "parents_view_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "parents_update_own_relationships_secure" ON public.parent_children;

CREATE POLICY "parents_view_own_relationships_secure" 
ON public.parent_children FOR SELECT 
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_update_own_relationships_secure" 
ON public.parent_children FOR UPDATE 
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

-- 2. Ensure children table policies are safe
DROP POLICY IF EXISTS "parents_view_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_update_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_delete_own_children_secure" ON public.children;

CREATE POLICY "parents_view_own_children_secure"
ON public.children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_update_own_children_secure"
ON public.children FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_delete_own_children_secure"
ON public.children FOR DELETE
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);
