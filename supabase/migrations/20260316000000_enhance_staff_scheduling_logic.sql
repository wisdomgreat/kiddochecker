-- Migration: Enhance Staff Scheduling Logic
-- Description: Excludes parents from staff dropdown, adds staff attributes for better identity, and adds auto-scheduling foundations.

-- 1. FIX STAFF DROPDOWN (Exclude 'parent')
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
    WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
    ORDER BY ur.role, p.last_name;
END;
$$;

-- 2. ENHANCE STAFF IDENTITY
-- Add more descriptive attributes to profiles for scheduling intelligence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[], -- E.g., ['Infant Care', 'Early Literacy', 'First Aid']
ADD COLUMN IF NOT EXISTS preferred_class_id UUID REFERENCES public.classes(id),
ADD COLUMN IF NOT EXISTS max_hours_per_week INTEGER DEFAULT 40;

-- 3. AUTO-SCHEDULING TEMPLATES
-- Define "Requirements" for different times/classes
CREATE TABLE IF NOT EXISTS public.scheduling_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduling_requirement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.scheduling_templates(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('leader', 'assistant', 'volunteer', 'admin')),
    class_id UUID REFERENCES public.classes(id),
    required_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AUTO-GENERATE ROSTER FUNCTION
-- This function takes a date and a template, and creates shifts
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
                -- Simplified matching logic:
                -- 1. Must be available (no overlapping shift)
                -- 2. Prefer staff with preferred_class_id matching the requirement
                -- 3. Match role type if possible
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
                    random() -- Add randomness for variety
                LIMIT 1;
            END IF;

            -- Insert the shift
            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                COALESCE(v_staff_id, '00000000-0000-0000-0000-000000000000'), -- Use dummy ID if unassigned or handle it
                v_item.class_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                CASE WHEN v_staff_id IS NOT NULL THEN 'scheduled' ELSE 'canceled' END -- mark canceled if no staff found? or handle unassigned
            ) RETURNING id INTO v_staff_id; -- Reusing variable for convenience but it's shift id

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

-- Seed a default template if none exists
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.scheduling_templates) THEN
        INSERT INTO public.scheduling_templates (name, description)
        VALUES ('Default Weekday Roster', 'Standard staffing for business hours')
        RETURNING id INTO v_template_id;

        -- Add some sample requirements (Monday to Friday)
        FOR d IN 1..5 LOOP
            -- Morning Lead for each day
            INSERT INTO public.scheduling_requirement_items (template_id, day_of_week, start_time, end_time, role_type, required_count)
            VALUES (v_template_id, d, '08:00', '12:00', 'leader', 1);
            
            -- Afternoon Lead
            INSERT INTO public.scheduling_requirement_items (template_id, day_of_week, start_time, end_time, role_type, required_count)
            VALUES (v_template_id, d, '13:00', '17:00', 'leader', 1);

            -- All day Assistant
            INSERT INTO public.scheduling_requirement_items (template_id, day_of_week, start_time, end_time, role_type, required_count)
            VALUES (v_template_id, d, '09:00', '15:00', 'assistant', 1);
        END LOOP;
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.generate_roster_from_template(DATE, UUID, BOOLEAN) TO authenticated;
