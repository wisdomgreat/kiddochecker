-- 🛤️ Visitor Journey Automation
-- Description: Automatically starts a follow-up journey when a new visitor is registered.

-- 1. Create journey_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    journey_type TEXT DEFAULT 'visitor_welcome',
    current_step INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    next_run_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can view journey progress" 
ON public.journey_progress FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')));

-- 2. Function to start a journey
CREATE OR REPLACE FUNCTION public.start_visitor_journey()
RETURNS TRIGGER AS $$
BEGIN
    -- Only for visitors
    IF NEW.membership_type = 'visitor' THEN
        INSERT INTO public.journey_progress (membership_id, next_run_at)
        VALUES (NEW.id, now());
        
        -- Log the initial event in interactions
        INSERT INTO public.visitor_interactions (visitor_id, interaction_type, content)
        SELECT profile_id, 'note', 'Started: Visitor Welcome Journey'
        FROM public.church_memberships WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on church_memberships
DROP TRIGGER IF EXISTS on_visitor_created ON public.church_memberships;
CREATE TRIGGER on_visitor_created
    AFTER INSERT ON public.church_memberships
    FOR EACH ROW EXECUTE FUNCTION public.start_visitor_journey();

-- 4. Placeholder for automated step processing
-- (Usually tied to a cron that calls an edge function, 
-- but we can log the requirement here)
COMMENT ON TABLE public.journey_progress IS 'Tracks automated follow-up steps for church guests.';
