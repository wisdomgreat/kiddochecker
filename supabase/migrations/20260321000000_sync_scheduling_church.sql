-- 🏛️ Synchronize Scheduling Generator with Church Management
-- Description: Adds ministry and volunteer role support to the roster templates and generation logic.

-- 1. Extend requirements table
ALTER TABLE public.scheduling_requirement_items 
ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS volunteer_role_id UUID REFERENCES public.volunteer_roles(id) ON DELETE SET NULL;

-- 2. Update Role Type Check (Add 'pastoral')
ALTER TABLE public.scheduling_requirement_items 
DROP CONSTRAINT IF EXISTS scheduling_requirement_items_role_type_check;

ALTER TABLE public.scheduling_requirement_items 
ADD CONSTRAINT scheduling_requirement_items_role_type_check 
CHECK (role_type IN ('leader', 'assistant', 'volunteer', 'admin', 'pastoral'));

-- 3. Update Generation RPC
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
    -- Get day of week from date (0-6)
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Loop through requirements for this day
    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        -- Calculate timestamps
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        -- Create shifts based on required_count
        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            -- If assignment is requested, try to find a suitable staff member
            IF p_assign_staff THEN
                -- Enhanced matching logic:
                -- 1. Must be available (no overlapping shift)
                -- 2. Prefer staff with matching preferred_class_id OR ministry_id
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    (p.preferred_class_id = v_item.class_id) DESC, 
                    random()
                LIMIT 1;
            END IF;

            -- Insert the shift with church context
            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                ministry_id,
                volunteer_role_id,
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                v_staff_id, -- Can be NULL (OPEN POSITION)
                v_item.class_id,
                v_item.ministry_id,
                v_item.volunteer_role_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                CASE WHEN v_staff_id IS NOT NULL THEN 'scheduled' ELSE 'scheduled' END -- mark scheduled even if unassigned (OPEN)
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
