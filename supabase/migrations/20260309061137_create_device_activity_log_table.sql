
-- Migration: Create device_activity_log table
-- Date: 2026-03-09

CREATE TABLE IF NOT EXISTS public.device_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.enrolled_devices(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Super admins can view device logs" ON public.device_activity_log;
CREATE POLICY "Super admins can view device logs" 
    ON public.device_activity_log 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'super_admin' OR is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Allow system to insert device logs" ON public.device_activity_log;
CREATE POLICY "Allow system to insert device logs"
    ON public.device_activity_log
    FOR INSERT
    WITH CHECK (true);
