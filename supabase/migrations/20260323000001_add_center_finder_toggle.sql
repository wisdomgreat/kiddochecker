-- 🚩 Feature Flags: Center Finder Toggle
ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS show_center_finder BOOLEAN DEFAULT TRUE;

-- Update the storage of existing settings to ensure the column is populated
UPDATE public.organization_settings SET show_center_finder = TRUE WHERE show_center_finder IS NULL;
