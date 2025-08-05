
-- Phase 1: Database & Security Fixes

-- Fix database security by updating functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is an organization creator signup
  -- If so, skip default role assignment (will be handled by assign_organization_creator_role)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS TRUE THEN
    -- For organization creators, create a temporary role that will be updated
    INSERT INTO public.user_roles (user_id, role, is_super_admin)
    VALUES (NEW.id, 'admin'::app_role, true);
  ELSE
    -- Assign default parent role for regular signups only
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update assign_organization_creator_role function
CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the user's role to super_admin and set is_super_admin flag
  UPDATE public.user_roles 
  SET 
    role = 'super_admin'::app_role,
    is_super_admin = true,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- If no role exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, is_super_admin)
    VALUES (p_user_id, 'super_admin'::app_role, true);
  END IF;
  
  -- Update organization settings to link creator
  UPDATE public.organization_settings
  SET created_by = p_user_id
  WHERE id = p_org_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    CASE 
      WHEN is_super_admin = true THEN 'super_admin'::app_role
      ELSE role
    END,
    'parent'::app_role
  )
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Update is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  );
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND (
      user_roles.role = has_role.role 
      OR (has_role.role = 'admin' AND user_roles.is_super_admin = true)
      OR (user_roles.role = 'super_admin')
      OR (user_roles.is_super_admin = true)
    )
  );
END;
$$;

-- Create a function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(
  role app_role,
  is_super_admin boolean,
  can_access_admin boolean,
  can_access_parent boolean,
  can_manage_children boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.role,
    ur.is_super_admin,
    (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true) as can_access_admin,
    (ur.role = 'parent') as can_access_parent,
    (ur.role = 'parent' OR ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true) as can_manage_children
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
  LIMIT 1;
END;
$$;

-- Create checkouts service function
CREATE OR REPLACE FUNCTION public.checkout_child(p_attendance_id uuid, p_checked_out_by uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE attendance 
  SET 
    checked_out_at = now(),
    checked_out_by = p_checked_out_by
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Create check-in service function
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attendance_id uuid;
BEGIN
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_by,
    attendance_date,
    checked_in_at
  )
  VALUES (
    p_child_id,
    p_class_id,
    p_checked_in_by,
    CURRENT_DATE,
    now()
  )
  RETURNING id INTO attendance_id;
  
  RETURN attendance_id;
END;
$$;

-- Update children RLS policies to be more specific
DROP POLICY IF EXISTS "Admin can manage all children" ON children;
DROP POLICY IF EXISTS "Parents can delete their children" ON children;
DROP POLICY IF EXISTS "Parents can insert own children" ON children;
DROP POLICY IF EXISTS "Parents can insert their children" ON children;
DROP POLICY IF EXISTS "Parents can manage their own children" ON children;
DROP POLICY IF EXISTS "Parents can update own children" ON children;
DROP POLICY IF EXISTS "Parents can update their children" ON children;
DROP POLICY IF EXISTS "Parents can view own children" ON children;
DROP POLICY IF EXISTS "Parents can view their children" ON children;
DROP POLICY IF EXISTS "Parents can view their own children" ON children;
DROP POLICY IF EXISTS "Staff and admin can view all children" ON children;
DROP POLICY IF EXISTS "Staff can update all children" ON children;
DROP POLICY IF EXISTS "Staff can view all children" ON children;

-- Create simplified and clear RLS policies for children
CREATE POLICY "Super admins can manage all children"
ON children FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'super_admin' OR is_super_admin = true)
  )
);

CREATE POLICY "Admins can manage all children"
ON children FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Parents can manage their own children"
ON children FOR ALL
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Staff can view and update all children"
ON children FOR SELECT, UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('staff', 'teacher', 'teacher_assistant')
  )
);
