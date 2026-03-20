-- 🕊️ Volunteer Engine - Church Management Extension
-- Enhances the existing 'shifts' and 'events' infrastructure for congregational service scheduling.

-- 1. Volunteer Roles (Specific to Ministries)
CREATE TABLE IF NOT EXISTS public.volunteer_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    skills_required TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enhance Shifts with Church Context
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS volunteer_role_id UUID REFERENCES public.volunteer_roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL;

-- 3. RLS for Volunteer Roles
ALTER TABLE public.volunteer_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public authenticated can view volunteer roles"
ON public.volunteer_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage volunteer roles"
ON public.volunteer_roles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
);

-- 4. RPC to get Volunteer coverage for an event
CREATE OR REPLACE FUNCTION get_event_volunteer_stats(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_positions', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id),
        'filled_positions', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id AND staff_id IS NOT NULL),
        'open_positions', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id AND staff_id IS NULL),
        'confirmed_count', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id AND status = 'confirmed')
    ) INTO result;
    RETURN result;
END;
$$;
