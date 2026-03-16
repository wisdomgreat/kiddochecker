-- Migration: Staff Groups and Attributes
-- Description: Adds department and group classification for staff to optimize scheduling and auto-assignment.

-- 1. ADD DEPARTMENT TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. CREATE STAFF GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.staff_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE GROUP MEMBERSHIP TABLE
CREATE TABLE IF NOT EXISTS public.staff_group_members (
    group_id UUID REFERENCES public.staff_groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, profile_id)
);

-- 4. UPDATE SCHEDULING REQUIREMENTS
ALTER TABLE public.scheduling_requirement_items ADD COLUMN IF NOT EXISTS required_group_id UUID REFERENCES public.staff_groups(id);

-- 5. UPGRADE AUTO-GENERATOR WITH GROUP INTELLIGENCE
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
                -- ADVANCED SCORING LOGIC V2 (With Group Intelligence):
                -- 1. Must be available (no overlaps)
                -- 2. Must not be 'parent', 'child', or 'kiosk'
                -- 3. MATCH GROUP (Highest priority)
                -- 4. Match 'Role Type'
                -- 5. Match Preferred Class
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
                    -- Score based on Group Membership (The new core requirement)
                    (CASE 
                        WHEN v_item.required_group_id IS NOT NULL AND EXISTS (
                            SELECT 1 FROM public.staff_group_members sgm 
                            WHERE sgm.profile_id = p.id AND sgm.group_id = v_item.required_group_id
                        ) THEN 50 -- Heavy weight for group match
                        ELSE 0 
                    END) DESC,
                    -- Score based on role match
                    (CASE 
                        WHEN v_item.role_type = 'leader' AND ur.role::text IN ('teacher', 'admin', 'super_admin') THEN 10
                        WHEN v_item.role_type = 'assistant' AND ur.role::text IN ('teacher_assistant', 'staff', 'volunteer') THEN 10
                        WHEN v_item.role_type = 'admin' AND ur.role::text IN ('admin', 'super_admin', 'staff') THEN 10
                        WHEN v_item.role_type::text = ur.role::text THEN 15 
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

-- 6. SEED SOME GROUPS
INSERT INTO public.staff_groups (name, description)
VALUES 
    ('Technical Support', 'IT equipment, network, and device management'),
    ('Kitchen & Nutrition', 'Meal preparation and cleanliness'),
    ('Admin Operations', 'Office management and logistics'),
    ('Security', 'Premises safety and check-in assistance'),
    ('Academic Lead', 'Core curriculum and teaching leads')
ON CONFLICT (name) DO NOTHING;

GRANT SELECT ON public.staff_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.staff_group_members TO authenticated;
