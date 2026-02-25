-- ============================================================
-- Migration: Comprehensive RLS Cleanup and Recursion Fix
-- Date: 2026-02-25
-- ============================================================

-- 1. DROP ALL POTENTIALLY CONFLICTING POLICIES
-- Children
DROP POLICY IF EXISTS "Admin can manage all children" ON public.children;
DROP POLICY IF EXISTS "admins_staff_manage_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "admins_staff_view_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_delete_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_insert_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_update_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_view_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "staff_admin_manage_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "staff_admin_view_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "teachers_view_assigned_children_secure" ON public.children;

-- Parent-Children Relationships
DROP POLICY IF EXISTS "parents_view_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "parents_insert_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "parents_update_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "admins_delete_relationships_secure" ON public.parent_children;

-- User Roles (Major source of recursion)
DROP POLICY IF EXISTS "users_read_own_role_safe" ON public.user_roles;
DROP POLICY IF EXISTS "super_admins_manage_roles_safe" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;

-- 2. RE-IMPLEMENT CLEAN POLICIES

-- ==========================================
-- USER_ROLES (Non-recursive)
-- ==========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_role" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (is_admin_secure());

-- ==========================================
-- CHILDREN
-- ==========================================
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Simple INSERT for parents
CREATE POLICY "parents_insert_children"
ON public.children FOR INSERT 
TO authenticated 
WITH CHECK (parent_id = auth.uid());

-- SELECT for parents and staff
CREATE POLICY "authenticated_view_children"
ON public.children FOR SELECT 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure() 
  OR has_role_secure('staff'::app_role)
  OR has_role_secure('teacher'::app_role)
  OR has_role_secure('teacher_assistant'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = id AND pc.parent_id = auth.uid()
  )
);

-- UPDATE for parents and staff
CREATE POLICY "authenticated_update_children"
ON public.children FOR UPDATE 
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

-- DELETE for parents and staff
CREATE POLICY "authenticated_delete_children"
ON public.children FOR DELETE 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure()
);

-- ==========================================
-- PARENT_CHILDREN (Relationships)
-- ==========================================
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_view_relationships"
ON public.parent_children FOR SELECT 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure() 
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_insert_relationships"
ON public.parent_children FOR INSERT 
TO authenticated 
WITH CHECK (parent_id = auth.uid() OR is_admin_secure());

CREATE POLICY "authenticated_manage_relationships"
ON public.parent_children FOR ALL 
TO authenticated 
USING (is_admin_secure() OR parent_id = auth.uid());
