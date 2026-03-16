-- Migration: Fix staff dropdown and add scheduling helpers
-- Description: Ensures super_admin and volunteer are included in recipient list and adds availability helpers.

-- 1. UPDATE RECIPIENT LIST
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
    WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'parent')
    ORDER BY ur.role, p.last_name;
END;
$$;

-- 2. ADD AUTO-SCHEDULING HELPERS (Future proofing)
-- Function to get staff who are NOT already scheduled during a specific window
CREATE OR REPLACE FUNCTION public.get_available_staff_for_window(
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    staff_id UUID,
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
    WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
    AND NOT EXISTS (
        SELECT 1 
        FROM public.shifts s
        WHERE s.staff_id = p.id
        AND s.status != 'canceled'
        AND (p_start_time, p_end_time) OVERLAPS (s.start_time, s.end_time)
    )
    ORDER BY p.last_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_recipients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_staff_for_window(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
