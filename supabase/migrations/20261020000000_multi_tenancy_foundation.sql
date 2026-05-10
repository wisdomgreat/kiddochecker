-- 🏢 Phase 2: Multi-Tenancy Foundation
-- Objective: Establish the top-level 'organizations' structure to support English/Spanish congregations.

-- 1. Create the organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. 'english-church', 'spanish-church'
    language_code TEXT DEFAULT 'en', -- 'en', 'es'
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add organization_id to core tables
-- Note: We allow NULL initially to avoid breaking existing data during migration.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Seed initial congregations
INSERT INTO public.organizations (name, slug, language_code)
VALUES 
('KiddoChecker English', 'english-church', 'en'),
('KiddoChecker Spanish', 'spanish-church', 'es')
ON CONFLICT (slug) DO NOTHING;

-- 4. RLS Policy: Only super_admins can see all organizations
CREATE POLICY "Super Admins can manage all organizations"
ON public.organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- 5. RLS Policy: Users can see their own organization
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
