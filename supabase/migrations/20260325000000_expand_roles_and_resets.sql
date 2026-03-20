-- 🎟️ Expand Roles & Security Features
-- Description: Adds 'regular_user' role and provides a placeholder for password reset automation.

-- 1. Add regular_user to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'regular_user';

-- 2. Ensure volunteer role is definitely present (just in case)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';

-- 3. Update profiles handle function (already updated in previous migrations but good to keep in sync)
-- We'll just leave the trigger alone as it's already robust.
