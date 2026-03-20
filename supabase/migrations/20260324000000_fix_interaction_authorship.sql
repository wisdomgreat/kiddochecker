-- 🛠️ Fix Visitor Interactions: Set default for created_by
-- Description: Ensure visitor_interactions table records who created the entry by default.

-- 1. Add default auth.uid() if missing (or a trigger)
ALTER TABLE public.visitor_interactions 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 2. Update existing nulls if any (using some system user or current user if run manually)
-- Since we are on Supabase, existing records might have null created_by.
-- We can't easily map them back, but for new ones it will work.

-- 3. Ensure profiles are visible to staff (re-verifying RLS)
-- Profiles for 'staff' should be visible to 'staff' if they are authors of interactions.
-- (This should already be handled by the public access for authenticated users in the profiles table but let's be double sure)
