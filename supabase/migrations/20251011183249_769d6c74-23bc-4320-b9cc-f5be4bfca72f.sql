-- Fix database security functions with CASCADE
-- Drop dependent policies first, then recreate function

-- Drop and recreate has_role function with proper settings using CASCADE
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate the dropped RLS policies that depend on has_role
CREATE POLICY "Admin can manage all children" ON public.children
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage custom roles" ON public.custom_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage permissions" ON public.permissions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage staff invitations" ON public.staff_invitations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage user custom roles" ON public.user_custom_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete device profiles" ON public.device_profiles
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert device profiles" ON public.device_profiles
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update device profiles" ON public.device_profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff and admin can manage classes" ON public.classes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff and admin can manage teachers" ON public.teachers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff and admin can view all attendance" ON public.attendance
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));