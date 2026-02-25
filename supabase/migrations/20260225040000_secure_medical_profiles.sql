
-- Migration: Restrict Child Medical Profile Editing to Parents and Admins
-- Date: 2026-02-25

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "parents_manage_own_child_medical" ON public.child_medical_profiles;

-- 1. VIEW POLICY: Parents, Admins, Staff, Teachers can view medical profiles
CREATE POLICY "view_child_medical_profiles" ON public.child_medical_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
    OR has_role_secure('staff'::app_role)
    OR has_role_secure('teacher'::app_role)
    OR has_role_secure('teacher_assistant'::app_role)
  );

-- 2. MANAGE POLICY: Only Parents (for their own children) and Admins can Manage (Insert/Update/Delete)
CREATE POLICY "manage_child_medical_profiles" ON public.child_medical_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
  );
