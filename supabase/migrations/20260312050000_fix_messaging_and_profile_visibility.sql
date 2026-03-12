-- Migration: 20260312050000_fix_messaging_and_profile_visibility.sql
-- Description: Allow users to find colleagues and staff for messaging, and ensure messaging permissions are correctly assigned.

-- 1. FIX PROFILE VISIBILITY
-- Previously, users could only view their own profile. For messaging to work, 
-- users need to see the names and roles of other people they might message.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view staff profiles" ON public.profiles;

-- Create an enhanced SELECT policy for profiles
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  -- Always see your own profile
  id = auth.uid()
  -- OR you are an Admin/Staff member (can see everyone for management)
  OR public.check_user_permission(auth.uid(), 'view_users')
  OR public.check_user_permission(auth.uid(), 'send_messages')
  -- OR you are viewing a Staff member, Teacher, or Admin (Public/Team directory)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
  )
);


-- 2. ENSURE PERMISSIONS ARE ASSIGNED
-- Ensure all relevant roles have messaging permissions if they were missed.

-- Ensure Staff can send messages
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'Staff' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- Ensure Teacher can send messages
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'Teacher' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- Ensure Teacher Assistant can send messages
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'Teacher_Assistant' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- Ensure everyone has view_messages to see their inbox
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name IN ('Admin', 'Staff', 'Teacher', 'Teacher_Assistant', 'Parent') 
AND p.name = 'view_messages'
ON CONFLICT DO NOTHING;


-- 3. FIX RECIPIENT FETCH VIEW/FUNCTION (Optional but helpful)
-- If the frontend join is failing due to complex RLS, a security definer function helps.
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role::text
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role::text IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'parent')
    ORDER BY ur.role, p.last_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_recipients() TO authenticated;
