-- Add show_wellness_check to organization_settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS show_wellness_check BOOLEAN DEFAULT TRUE;
