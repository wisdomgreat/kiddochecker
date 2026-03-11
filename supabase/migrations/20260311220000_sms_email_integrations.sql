-- Migration: 20260311220000_sms_email_integrations.sql

CREATE TABLE IF NOT EXISTS public.communication_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    twilio_phone_number TEXT,
    sendgrid_api_key TEXT,
    sendgrid_from_email TEXT,
    enable_sms_pickups BOOLEAN DEFAULT false,
    enable_email_pickups BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert exactly one row for organization communication settings
INSERT INTO public.communication_settings (twilio_account_sid) VALUES (NULL) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.communication_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin select communication_settings" 
    ON public.communication_settings FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
    
CREATE POLICY "Admin update communication_settings" 
    ON public.communication_settings FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
    
CREATE POLICY "Admin insert communication_settings" 
    ON public.communication_settings FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Update Messages Table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sent_via_sms BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sent_via_email BOOLEAN DEFAULT false;
