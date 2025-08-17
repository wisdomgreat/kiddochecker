
-- Phase 1: Database & Security Foundation
-- Fix infinite recursion in RLS policies and create proper security definer functions

-- First, drop existing problematic policies to prevent recursion
DROP POLICY IF EXISTS "admins_manage_all_roles_safe" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role_safe" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_all_profiles_safe" ON public.profiles;

-- Create comprehensive security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT COALESCE(ur.role, 'parent'::app_role)
  INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'parent'::app_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT COALESCE(ur.is_super_admin, false) OR (ur.role = 'super_admin'::app_role)
  INTO is_admin
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN is_admin;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT (ur.role IN ('admin'::app_role, 'super_admin'::app_role) OR ur.is_super_admin = true)
  INTO is_admin
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role_secure(check_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_has_role boolean := false;
BEGIN
  -- Super admins have all roles
  IF public.is_super_admin_secure() THEN
    RETURN true;
  END IF;
  
  SELECT (ur.role = check_role)
  INTO user_has_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_has_role, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Create new secure RLS policies for user_roles
CREATE POLICY "users_read_own_role_secure"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles_secure"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN auth.jwt()->>'role' = 'service_role' THEN true
    ELSE public.is_admin_secure()
  END
)
WITH CHECK (
  CASE 
    WHEN auth.jwt()->>'role' = 'service_role' THEN true
    ELSE public.is_admin_secure()
  END
);

-- Create new secure RLS policies for profiles
CREATE POLICY "users_manage_own_profile_secure"
ON public.profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admins_manage_all_profiles_secure"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- Fix attendance policies
DROP POLICY IF EXISTS "Staff and admin can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;

CREATE POLICY "staff_admin_manage_attendance_secure"
ON public.attendance
FOR ALL
TO authenticated
USING (
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role)
)
WITH CHECK (
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role)
);

-- Fix children policies
DROP POLICY IF EXISTS "Staff and admin can view all children" ON public.children;
DROP POLICY IF EXISTS "Staff can update all children" ON public.children;
DROP POLICY IF EXISTS "Staff can view all children" ON public.children;

CREATE POLICY "staff_admin_view_all_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
  )
);

CREATE POLICY "staff_admin_manage_all_children_secure"
ON public.children
FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
  )
)
WITH CHECK (
  parent_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
  )
);

-- Create child_notes table for teachers to add notes
CREATE TABLE IF NOT EXISTS public.child_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'behavioral', 'medical', 'academic', 'parent_communication')),
  is_private boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.child_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_child_notes"
ON public.child_notes
FOR ALL
TO authenticated
USING (
  teacher_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR
  (public.has_role_secure('parent'::app_role) AND is_private = false AND 
   EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_notes.child_id AND c.parent_id = auth.uid()))
)
WITH CHECK (
  teacher_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role)
);

-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_activity_logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- Create comprehensive reporting views
CREATE OR REPLACE VIEW public.attendance_summary AS
SELECT 
  a.attendance_date,
  COUNT(DISTINCT a.child_id) as total_children,
  COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count,
  COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count,
  COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present,
  c.name as class_name,
  c.id as class_id
FROM public.attendance a
LEFT JOIN public.classes c ON a.class_id = c.id
GROUP BY a.attendance_date, c.name, c.id
ORDER BY a.attendance_date DESC;

-- Fix organization settings policies
DROP POLICY IF EXISTS "Only admins can insert organization settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Only admins can update organization settings" ON public.organization_settings;

CREATE POLICY "admins_manage_organization_settings_secure"
ON public.organization_settings
FOR ALL
TO authenticated
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_child_id ON public.attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_notes_child_id ON public.child_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_child_notes_teacher_id ON public.child_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Update existing database functions to use secure versions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_current_user_role_secure();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_admin_secure();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_admin_secure();
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If checking current user, use secure function
  IF user_id = auth.uid() THEN
    RETURN public.has_role_secure(role);
  END IF;
  
  -- For other users, only admins can check
  IF NOT public.is_admin_secure() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id
    AND (ur.role = has_role.role OR (has_role.role = 'admin' AND ur.is_super_admin = true))
  );
END;
$$;

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers where missing
DROP TRIGGER IF EXISTS update_child_notes_updated_at ON public.child_notes;
CREATE TRIGGER update_child_notes_updated_at
  BEFORE UPDATE ON public.child_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
