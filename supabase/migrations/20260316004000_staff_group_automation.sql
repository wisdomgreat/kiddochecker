-- Migration: Staff Group Automation
-- Description: Adds rules for automatically assigning staff to groups based on their attributes (role, department, etc).

-- 1. GROUP AUTOMATION RULES
CREATE TABLE IF NOT EXISTS public.staff_group_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.staff_groups(id) ON DELETE CASCADE,
    attribute_type TEXT NOT NULL, -- 'role' or 'department'
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, attribute_type, attribute_value)
);

-- 2. TRIGGER TO AUTO-ASSIGN GROUPS
CREATE OR REPLACE FUNCTION public.apply_group_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove old auto-assigned groups? Maybe better to just add new ones.
    -- For simplicity, let's just add matches.
    
    -- Match by Role
    INSERT INTO public.staff_group_members (group_id, profile_id)
    SELECT sgr.group_id, NEW.id
    FROM public.staff_group_rules sgr
    JOIN public.user_roles ur ON ur.user_id = NEW.id
    WHERE sgr.attribute_type = 'role' AND sgr.attribute_value = ur.role::text
    ON CONFLICT DO NOTHING;

    -- Match by Department
    IF NEW.department IS NOT NULL THEN
        INSERT INTO public.staff_group_members (group_id, profile_id)
        SELECT group_id, NEW.id
        FROM public.staff_group_rules
        WHERE attribute_type = 'department' AND attribute_value = NEW.department
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_rules
AFTER INSERT OR UPDATE OF department ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.apply_group_rules();

-- 3. SEED SOME RULES
-- Academic Lead group (Assumed created in previous migration)
DO $$
DECLARE
    v_acad_id UUID;
    v_tech_id UUID;
BEGIN
    SELECT id INTO v_acad_id FROM public.staff_groups WHERE name = 'Academic Lead';
    SELECT id INTO v_tech_id FROM public.staff_groups WHERE name = 'Technical Support';

    IF v_acad_id IS NOT NULL THEN
        INSERT INTO public.staff_group_rules (group_id, attribute_type, attribute_value)
        VALUES (v_acad_id, 'role', 'teacher'), (v_acad_id, 'role', 'teacher_assistant')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_tech_id IS NOT NULL THEN
        INSERT INTO public.staff_group_rules (group_id, attribute_type, attribute_value)
        VALUES (v_tech_id, 'department', 'IT'), (v_tech_id, 'department', 'Tech')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
