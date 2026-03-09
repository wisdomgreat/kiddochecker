
-- Migration: Fix Profiles RLS and Secure Kiosk Fetch
-- Date: 2026-03-09

-- 1. FIX PROFILES RLS
-- Users must be able to see and edit their own profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Ensure Super Admins can still manage everything (already exists but making it clean)
DROP POLICY IF EXISTS "super_admins_manage_all_profiles" ON public.profiles;
CREATE POLICY "super_admins_manage_all_profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
);

-- 2. SECURE KIOSK CHILDREN FETCH
-- Allow unauthenticated kiosk to fetch children for a parent if they have the correct PIN
-- This avoids opening up the 'children' table RLS to anon.

CREATE OR REPLACE FUNCTION public.get_children_for_kiosk(p_parent_id uuid, p_pin text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  gender text,
  date_of_birth date,
  parent_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the PIN first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_parent_id AND security_pin = p_pin
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.first_name, c.last_name, c.gender, c.date_of_birth, c.parent_id
  FROM public.children c
  WHERE c.parent_id = p_parent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_children_for_kiosk(uuid, text) TO anon, authenticated;

-- 3. FIX FOR MIGRATION CONFLICTS (RETRY PREVIOUS FAILED MIGRATION IDEMPOTENTLY)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' AND policyname = 'staff_update_own_verification_status'
    ) THEN
        CREATE POLICY "staff_update_own_verification_status"
        ON public.user_roles
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (
          user_id = auth.uid()
          AND role = (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
          AND is_super_admin = (SELECT ur.is_super_admin FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
        );
    END IF;
END $$;
