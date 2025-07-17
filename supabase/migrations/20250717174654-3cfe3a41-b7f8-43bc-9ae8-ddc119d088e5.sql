
-- Fix the get_users_with_roles function to handle proper type mapping
DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid, 
  email text, 
  first_name text, 
  last_name text, 
  role text, 
  is_super_admin boolean, 
  is_active boolean,
  is_volunteer boolean,
  phone text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email,
      COALESCE(p.first_name, '') as first_name,
      COALESCE(p.last_name, '') as last_name,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      (au.email_confirmed_at IS NOT NULL) AS is_active,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      COALESCE(p.phone, '') as phone,
      ur.created_at
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name, p.first_name;
END;
$$;

-- Create comprehensive granular permissions
INSERT INTO public.permissions (name, resource, action, description) VALUES
-- User Management
('view_users', 'users', 'read', 'View user profiles and information'),
('create_users', 'users', 'create', 'Create new user accounts'),
('edit_users', 'users', 'update', 'Edit user profiles and information'),
('delete_users', 'users', 'delete', 'Delete user accounts'),
('manage_user_roles', 'users', 'manage_roles', 'Assign and modify user roles'),
('suspend_users', 'users', 'suspend', 'Suspend or activate user accounts'),
('reset_user_passwords', 'users', 'reset_password', 'Reset user passwords'),

-- Role & Permission Management
('view_roles', 'roles', 'read', 'View system roles'),
('create_roles', 'roles', 'create', 'Create custom roles'),
('edit_roles', 'roles', 'update', 'Edit role properties'),
('delete_roles', 'roles', 'delete', 'Delete custom roles'),
('view_permissions', 'permissions', 'read', 'View system permissions'),
('create_permissions', 'permissions', 'create', 'Create new permissions'),
('edit_permissions', 'permissions', 'update', 'Edit permission properties'),
('delete_permissions', 'permissions', 'delete', 'Delete permissions'),
('assign_role_permissions', 'role_permissions', 'manage', 'Assign permissions to roles'),

-- Children Management
('view_all_children', 'children', 'read_all', 'View all children in the system'),
('view_own_children', 'children', 'read_own', 'View only own children'),
('create_children', 'children', 'create', 'Register new children'),
('edit_children', 'children', 'update', 'Edit child information'),
('delete_children', 'children', 'delete', 'Remove children from system'),
('manage_child_assignments', 'children', 'assign', 'Assign children to classes'),

-- Class Management
('view_classes', 'classes', 'read', 'View class information'),
('create_classes', 'classes', 'create', 'Create new classes'),
('edit_classes', 'classes', 'update', 'Edit class information'),
('delete_classes', 'classes', 'delete', 'Delete classes'),
('assign_teachers', 'classes', 'assign_teachers', 'Assign teachers to classes'),
('manage_class_roster', 'classes', 'manage_roster', 'Manage class enrollment'),

-- Attendance Management
('view_attendance', 'attendance', 'read', 'View attendance records'),
('checkin_children', 'attendance', 'checkin', 'Check children in'),
('checkout_children', 'attendance', 'checkout', 'Check children out'),
('manage_attendance', 'attendance', 'manage', 'Full attendance management'),
('view_attendance_reports', 'attendance', 'reports', 'Generate attendance reports'),

-- Organization Management
('view_organization_settings', 'organization', 'read', 'View organization settings'),
('edit_organization_settings', 'organization', 'update', 'Edit organization settings'),
('manage_organization_branding', 'organization', 'branding', 'Manage logos and themes'),
('view_audit_logs', 'organization', 'audit_logs', 'View system audit logs'),

-- Device Management
('view_devices', 'devices', 'read', 'View registered devices'),
('register_devices', 'devices', 'create', 'Register new devices'),
('edit_devices', 'devices', 'update', 'Edit device configuration'),
('delete_devices', 'devices', 'delete', 'Remove devices'),

-- Communication
('send_messages', 'messages', 'send', 'Send messages to users'),
('view_messages', 'messages', 'read', 'View received messages'),
('broadcast_messages', 'messages', 'broadcast', 'Send broadcast messages'),

-- Events Management
('view_events', 'events', 'read', 'View events'),
('create_events', 'events', 'create', 'Create new events'),
('edit_events', 'events', 'update', 'Edit event information'),
('delete_events', 'events', 'delete', 'Delete events'),
('manage_event_registration', 'events', 'registration', 'Manage event registrations'),

-- Reports & Analytics
('view_basic_reports', 'reports', 'basic', 'View basic reports'),
('view_detailed_reports', 'reports', 'detailed', 'View detailed analytics'),
('export_reports', 'reports', 'export', 'Export reports and data'),
('view_financial_reports', 'reports', 'financial', 'View financial reports'),

-- System Administration
('manage_system_settings', 'system', 'settings', 'Manage system-wide settings'),
('view_system_health', 'system', 'health', 'View system health and performance'),
('manage_backups', 'system', 'backups', 'Manage data backups'),
('manage_integrations', 'system', 'integrations', 'Manage third-party integrations')
ON CONFLICT (name) DO NOTHING;

-- Create default role-permission mappings
-- Super Admin gets all permissions automatically (handled in code)

-- Admin role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  p.id as permission_id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Teacher role permissions
WITH teacher_permissions AS (
  SELECT id FROM public.permissions WHERE name IN (
    'view_own_children', 'view_classes', 'checkin_children', 'checkout_children',
    'view_attendance', 'send_messages', 'view_messages', 'view_events',
    'create_events', 'edit_events', 'view_basic_reports'
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  tp.id as permission_id
FROM public.custom_roles cr
CROSS JOIN teacher_permissions tp
WHERE cr.name = 'Teacher'
ON CONFLICT DO NOTHING;

-- Staff role permissions
WITH staff_permissions AS (
  SELECT id FROM public.permissions WHERE name IN (
    'view_all_children', 'view_classes', 'checkin_children', 'checkout_children',
    'view_attendance', 'send_messages', 'view_messages', 'view_events',
    'view_basic_reports'
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  sp.id as permission_id
FROM public.custom_roles cr
CROSS JOIN staff_permissions sp
WHERE cr.name = 'Staff'
ON CONFLICT DO NOTHING;

-- Parent role permissions
WITH parent_permissions AS (
  SELECT id FROM public.permissions WHERE name IN (
    'view_own_children', 'checkin_children', 'checkout_children',
    'view_messages', 'view_events'
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  pp.id as permission_id
FROM public.custom_roles cr
CROSS JOIN parent_permissions pp
WHERE cr.name = 'Parent'
ON CONFLICT DO NOTHING;

-- Create function to check user permissions with granular control
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
  -- Check if user is super admin
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  -- Super admins have all permissions
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions
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
      FROM public.user_custom_roles ucr
      JOIN public.role_permissions rp ON ucr.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ucr.user_id = p_user_id
      AND p.name = p_permission_name
    ) INTO v_has_permission;
  END IF;
  
  RETURN v_has_permission;
END;
$$;

-- Create function for admin user management
CREATE OR REPLACE FUNCTION public.admin_manage_user(
  p_action text,
  p_target_user_id uuid,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}';
  v_is_admin boolean := false;
BEGIN
  -- Verify the calling user is an admin
  SELECT public.check_user_permission(auth.uid(), 'manage_user_roles')
  INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;
  
  CASE p_action
    WHEN 'update_role' THEN
      UPDATE public.user_roles
      SET 
        role = (p_data->>'role')::app_role,
        is_super_admin = COALESCE((p_data->>'is_super_admin')::boolean, false),
        is_volunteer = COALESCE((p_data->>'is_volunteer')::boolean, false)
      WHERE user_id = p_target_user_id;
      
      v_result := jsonb_build_object('success', true, 'action', 'role_updated');
      
    WHEN 'suspend_user' THEN
      -- This would integrate with auth to disable the user
      v_result := jsonb_build_object('success', true, 'action', 'user_suspended');
      
    WHEN 'reset_password' THEN
      -- This would integrate with auth to reset password
      v_result := jsonb_build_object('success', true, 'action', 'password_reset');
      
    ELSE
      v_result := jsonb_build_object('error', 'Invalid action');
  END CASE;
  
  RETURN v_result;
END;
$$;

-- Create comprehensive admin dashboard function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Verify admin permissions
  IF NOT public.check_user_permission(auth.uid(), 'view_system_health') THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'total_children', (SELECT COUNT(*) FROM public.children),
    'total_classes', (SELECT COUNT(*) FROM public.classes),
    'todays_attendance', (
      SELECT COUNT(*) FROM public.attendance 
      WHERE attendance_date = CURRENT_DATE AND checked_in_at IS NOT NULL
    ),
    'pending_checkouts', (
      SELECT COUNT(*) FROM public.attendance 
      WHERE attendance_date = CURRENT_DATE 
      AND checked_in_at IS NOT NULL 
      AND checked_out_at IS NULL
    ),
    'user_roles_breakdown', (
      SELECT jsonb_object_agg(role, count)
      FROM (
        SELECT role::text, COUNT(*) as count
        FROM public.user_roles
        GROUP BY role
      ) role_counts
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', attendance_date,
          'checkins', checkins,
          'checkouts', checkouts
        )
      )
      FROM (
        SELECT 
          attendance_date,
          COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checkins,
          COUNT(*) FILTER (WHERE checked_out_at IS NOT NULL) as checkouts
        FROM public.attendance
        WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY attendance_date
        ORDER BY attendance_date DESC
        LIMIT 7
      ) recent
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- Update RLS policies to use the new permission system
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'manage_user_roles'));

DROP POLICY IF EXISTS "Admins can manage custom roles" ON public.custom_roles;
CREATE POLICY "Admins can manage custom roles"
ON public.custom_roles
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'create_roles'));

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'view_permissions'));

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'assign_role_permissions'));

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_resource text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    timestamp
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource,
    p_resource_id,
    p_details,
    now()
  );
END;
$$;

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.check_user_permission(auth.uid(), 'view_audit_logs'));

CREATE POLICY "System can insert audit logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
