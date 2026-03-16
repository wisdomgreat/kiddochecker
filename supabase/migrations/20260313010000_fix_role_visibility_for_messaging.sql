-- Migration: 20260313010000_fix_role_visibility_for_messaging.sql
-- Description: Fix "undefined undefined" issue by ensuring staff roles and profiles are visible to authenticated users.

-- 1. Redefine check_user_permission to be even more robust
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean := false;
  v_has_permission boolean := false;
BEGIN
  -- Check if user is super admin (bypass)
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions (legacy roles)
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role::text = (
      SELECT name FROM public.custom_roles WHERE id = rp.role_id
    )
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  -- Also check custom role assignments
  IF NOT v_has_permission THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
    ) INTO v_has_permission;
  END IF;
  
  RETURN v_has_permission;
END;
$$;

-- 2. Update user_roles RLS to allow viewing staff roles
-- This is critical so that profiles RLS can check who is a staff member
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view staff roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
);

-- 3. Update profiles RLS to ensure staff members are visible
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  -- Always see your own profile
  id = auth.uid()
  -- OR you have explicit permission
  OR public.check_user_permission(auth.uid(), 'view_users'::text)
  OR public.check_user_permission(auth.uid(), 'send_messages'::text)
  -- OR you are viewing a Staff member (Checked directly via a secure subquery to avoid circular logic)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
  )
);
