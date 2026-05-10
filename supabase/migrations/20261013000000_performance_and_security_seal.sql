-- =============================================================
-- Migration: Performance and Security Seal
-- Description: Adds critical indices for reporting and seals security functions.
-- =============================================================

-- 1. Performance Indices
-- Attendance indices for fast reporting and dashboard loading
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_child_id ON public.attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON public.attendance(checked_in_at);

-- Profiles indices for fast search and roster listing
CREATE INDEX IF NOT EXISTS idx_profiles_names ON public.profiles(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_children_names ON public.children(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- Role indices for fast permission checks
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON public.user_roles(user_id, role);

-- 2. Security "Sealing"
-- Note: Manual ALTER statements removed. Global sealing is handled in migration 20261014.

-- 3. Cleanup: Consistency Repairs
-- Ensure organization_settings has a timezone if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_settings' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE public.organization_settings ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
    END IF;
END $$;

-- Update any null timezones to the default
UPDATE public.organization_settings SET timezone = 'America/New_York' WHERE timezone IS NULL;
