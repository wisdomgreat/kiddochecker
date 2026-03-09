
-- Migration: Create kiosk_settings table
-- Date: 2026-03-09

CREATE TABLE IF NOT EXISTS public.kiosk_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure description column exists (in case table was created partially)
ALTER TABLE public.kiosk_settings ADD COLUMN IF NOT EXISTS description TEXT;

-- Enable RLS
ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Super admins can manage kiosk settings" ON public.kiosk_settings;
CREATE POLICY "Super admins can manage kiosk settings" 
    ON public.kiosk_settings 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'super_admin' OR is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Allow public read-only access to kiosk settings" ON public.kiosk_settings;
CREATE POLICY "Allow public read-only access to kiosk settings"
    ON public.kiosk_settings
    FOR SELECT
    USING (true);

-- Seed default settings
INSERT INTO public.kiosk_settings (setting_key, setting_value, description)
VALUES 
('require_pin', 'false', 'Whether to require the Master PIN for new terminal activations'),
('kiosk_pin', '123456', 'Master PIN for activating terminals')
ON CONFLICT (setting_key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = now();
