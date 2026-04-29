
-- Migration: 20261010200000_disable_center_finder_by_default.sql
-- Description: Disable the center finder feature by default as requested.

UPDATE public.organization_settings 
SET show_center_finder = FALSE 
WHERE show_center_finder IS TRUE OR show_center_finder IS NULL;

-- Also update the default for future inserts
ALTER TABLE public.organization_settings 
ALTER COLUMN show_center_finder SET DEFAULT FALSE;
