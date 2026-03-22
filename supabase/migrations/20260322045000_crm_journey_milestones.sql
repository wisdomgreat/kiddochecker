
-- 1. Add journey_stage to church_memberships
ALTER TABLE public.church_memberships 
ADD COLUMN IF NOT EXISTS journey_stage TEXT DEFAULT 'initial_visit' 
CHECK (journey_stage IN ('initial_visit', 'followed_up', 'connected', 'member', 'leader', 'inactive'));

-- 2. Create milestones table for spiritual growth tracking
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- 'first_visit', 'decision', 'baptism', 'foundation_class', 'official_membership'
    attained_at DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create communications_log for CRM tracking
CREATE TABLE IF NOT EXISTS public.communications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id),
    communication_type TEXT NOT NULL, -- 'call', 'email', 'sms', 'in_person'
    summary TEXT NOT NULL,
    outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Admins and staff can manage milestones" ON public.milestones
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Admins and staff can manage communications" ON public.communications_log
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

-- 6. Trigger to log initial visit milestone
CREATE OR REPLACE FUNCTION public.log_initial_visit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.milestones (member_id, milestone_type, notes)
    VALUES (NEW.id, 'first_visit', 'Automatically recorded upon onboarding');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_member_onboarded_milestone ON public.church_memberships;
CREATE TRIGGER on_member_onboarded_milestone
AFTER INSERT ON public.church_memberships
FOR EACH ROW EXECUTE FUNCTION public.log_initial_visit();
