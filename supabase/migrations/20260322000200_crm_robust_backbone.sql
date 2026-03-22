
-- 1. Create journey_progress table to track automated workflows
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    journey_type TEXT NOT NULL DEFAULT 'visitor_welcome',
    current_step INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    next_run_at TIMESTAMPTZ DEFAULT now(),
    last_run_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create engagement_tasks for the Kanban Board
CREATE TABLE IF NOT EXISTS public.engagement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'backlog')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'follow_up',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    member_id UUID REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create donations table for giving tracking
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.church_memberships(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    donation_date TIMESTAMPTZ DEFAULT now(),
    payment_method TEXT, -- 'cash', 'card', 'transfer', 'check'
    category TEXT DEFAULT 'tithe', -- 'tithe', 'offering', 'building_fund', 'other'
    is_anonymous BOOLEAN DEFAULT false,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Admins and staff can manage journeys" ON public.journey_progress
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Admins and staff can manage tasks" ON public.engagement_tasks
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Users can see tasks assigned to them" ON public.engagement_tasks
    FOR SELECT TO authenticated USING (assigned_to = auth.uid());

CREATE POLICY "Admins and staff can view all donations" ON public.donations
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Admins can manage donations" ON public.donations
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 6. Trigger to automatically start journey for new visitors
CREATE OR REPLACE FUNCTION public.auto_start_visitor_journey()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membership_type = 'visitor' THEN
        INSERT INTO public.journey_progress (membership_id, journey_type, next_run_at)
        VALUES (NEW.id, 'visitor_welcome', now());
        
        -- Also create an initial task for the outreach team
        INSERT INTO public.engagement_tasks (title, description, member_id, category, priority)
        VALUES (
            'Initial Call: ' || (SELECT first_name || ' ' || last_name FROM profiles WHERE id = NEW.profile_id),
            'New visitor onboarded. Please make a welcome call within 48 hours.',
            NEW.id,
            'welcome_call',
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_visitor_created
AFTER INSERT ON public.church_memberships
FOR EACH ROW EXECUTE FUNCTION public.auto_start_visitor_journey();
