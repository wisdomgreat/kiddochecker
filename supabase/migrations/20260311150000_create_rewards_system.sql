
-- Migration: Create Rewards System
-- Date: 2026-03-11

-- 1. Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create reward_redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' -- pending, approved, fulfilled, rejected
);

-- 3. Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for rewards
CREATE POLICY "Anyone can view rewards" 
ON public.rewards FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can manage rewards" 
ON public.rewards FOR ALL 
TO authenticated 
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- 5. Create RLS Policies for reward_redemptions
CREATE POLICY "Users can view own redemptions" 
ON public.reward_redemptions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.is_admin_secure());

CREATE POLICY "Users can create redemptions" 
ON public.reward_redemptions FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all redemptions" 
ON public.reward_redemptions FOR ALL 
TO authenticated 
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- 6. Add search_path to functions
-- (is_admin_secure already has it from previous migrations)
