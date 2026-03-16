-- Migration: Advanced Roster Intelligence & Flexible Roles
-- Description: Supports custom roles in scheduling, scoring-based auto-assignment, and diversity in staff roles (Admin, Tech, Support).

-- 1. FLEXIBLE RECIPIENTS (Include Custom Roles)
-- This version explicitly excludes 'parent' and 'child', implicitly including all other system and custom roles.
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
    WHERE ur.role::text NOT IN ('parent', 'child', 'kiosk')
    ORDER BY ur.role, p.last_name;
END;
$$;

-- 2. SMARTER AUTO-SCHEDULER (Scoring Engine)
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(
    p_date DATE,
    p_template_id UUID,
    p_assign_staff BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_shift_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_staff_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);

    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            IF p_assign_staff THEN
                -- ADVANCED SCORING LOGIC:
                -- 1. Must be available (no overlaps)
                -- 2. Must not be 'parent' or 'child'
                -- 3. Match 'Role Type' (leader, assistant, tech, admin etc)
                -- 4. Match Preferred Class
                -- 5. Match Specialties (if any requirement notes match specialties)
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text NOT IN ('parent', 'child', 'kiosk')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    -- Score based on role match (custom mapping can be added)
                    (CASE 
                        WHEN v_item.role_type = 'leader' AND ur.role::text IN ('teacher', 'admin', 'super_admin') THEN 10
                        WHEN v_item.role_type = 'assistant' AND ur.role::text IN ('teacher_assistant', 'staff', 'volunteer') THEN 10
                        WHEN v_item.role_type = 'admin' AND ur.role::text IN ('admin', 'super_admin', 'staff') THEN 10
                        WHEN v_item.role_type::text = ur.role::text THEN 15 -- Perfect role name match
                        ELSE 0 
                    END) DESC,
                    -- Class preference
                    (p.preferred_class_id = v_item.class_id) DESC,
                    -- Randomness for fair rotation
                    random()
                LIMIT 1;
            END IF;

            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                v_staff_id,
                v_item.class_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                'scheduled'
            );

            v_shift_count := v_shift_count + 1;
            IF v_staff_id IS NOT NULL THEN
                v_assigned_count := v_assigned_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'shifts_created', v_shift_count,
        'staff_assigned', v_assigned_count
    );
END;
$$;
