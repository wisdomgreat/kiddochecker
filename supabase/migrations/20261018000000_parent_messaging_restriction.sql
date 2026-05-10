
-- 🔗 Staff Supervision & Parent Messaging Restriction
-- Migration: 20261018000000_parent_messaging_restriction.sql
-- Description: Adds supervisor field to profiles and restricts parent communication to child's teachers/supervisors.

-- 1. Add supervisor relationship to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id);

-- 2. Update get_available_recipients to enforce restrictions
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT;
BEGIN
    -- Get caller's primary role
    SELECT ur.role::text INTO v_caller_role 
    FROM public.user_roles ur 
    WHERE ur.user_id = v_caller_id 
    LIMIT 1;

    -- CASE 1: Caller is a Parent
    IF v_caller_role = 'parent' THEN
        RETURN QUERY
        SELECT DISTINCT
            p.id, 
            p.first_name, 
            p.last_name, 
            ur.role::text
        FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE 
            -- A: All Super Admins
            ur.role = 'super_admin'
            OR 
            -- B: Teachers assigned to their children's classes
            p.id IN (
                SELECT t.user_id 
                FROM public.teachers t
                JOIN public.children c ON t.class_id = c.class_id
                WHERE c.parent_id = v_caller_id
            )
            OR
            -- C: Supervisors of those teachers
            p.id IN (
                SELECT p_staff.supervisor_id
                FROM public.profiles p_staff
                JOIN public.teachers t ON p_staff.id = t.user_id
                JOIN public.children c ON t.class_id = c.class_id
                WHERE c.parent_id = v_caller_id
                AND p_staff.supervisor_id IS NOT NULL
            )
        ORDER BY ur.role, p.last_name;

    -- CASE 2: Caller is Staff/Admin/Teacher
    ELSE
        RETURN QUERY
        SELECT 
            p.id, 
            p.first_name, 
            p.last_name, 
            ur.role::text
        FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE 
            -- Staff can see other staff, admins, and parents
            ur.role::text NOT IN ('child', 'kiosk')
        ORDER BY ur.role, p.last_name;
    END IF;
END;
$$;

-- 3. Update Messaging RLS to block unauthorized sending
DROP POLICY IF EXISTS "messages_parent_send_restricted" ON public.messages;
CREATE POLICY "messages_parent_send_restricted"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    -- Admins/Staff can send to anyone (existing permission or logic)
    (SELECT role::text FROM user_roles WHERE user_id = auth.uid()) NOT IN ('parent')
    OR
    -- Parents can only send to recipients returned by the authorized list
    recipient_id IN (
        SELECT r.id FROM public.get_available_recipients() r
    )
);

-- 4. Clean up any existing messages policies that might be too permissive
-- (Handled by the previous nuclear sanitization which consolidated messages_self and messages_admin)
