
-- Migration: Add secure Staff Identity PIN system
-- Goal: Only Super-Admins can assign/reset these unique alphanumeric codes for staff.

-- 1. Add staff_pin column (mix of letters & numbers)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_pin TEXT UNIQUE;

-- 2. Create a function to generate a secure random alphanumeric PIN
CREATE OR REPLACE FUNCTION public.generate_random_alphanumeric(len integer DEFAULT 6)
RETURNS TEXT 
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z}'; -- Removed O and I to avoid confusion
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..len LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$;

-- 3. Strict trigger: Protect staff_pin from unauthorized updates
CREATE OR REPLACE FUNCTION protect_staff_pin()
RETURNS TRIGGER AS $$
BEGIN
  -- If staff_pin is changing, verify the actor is a super_admin
  IF (NEW.staff_pin IS DISTINCT FROM OLD.staff_pin) THEN
    -- Check if current user is super admin
    IF NOT (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (ur.role = 'super_admin'::app_role OR ur.is_super_admin = true)
      )
    ) THEN
      RAISE EXCEPTION 'Only Super-Admins can modify a Staff Identity PIN';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_staff_pin ON public.profiles;
CREATE TRIGGER tr_protect_staff_pin
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION protect_staff_pin();

-- 4. RPC for Super Admins to generate/reset a staff pin
CREATE OR REPLACE FUNCTION public.generate_staff_pin_rpc(p_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_pin text;
BEGIN
  -- Security check (Must be super admin)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'super_admin'::app_role OR ur.is_super_admin = true)
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Super-Admin role required';
  END IF;

  LOOP
    new_pin := public.generate_random_alphanumeric(6);
    -- Ensure uniqueness (unlikely collision with 6 chars alphanumeric but possible)
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE staff_pin = new_pin);
  END LOOP;

  UPDATE public.profiles SET staff_pin = new_pin WHERE id = p_user_id;
  RETURN new_pin;
END;
$$;

-- 5. Fix Profiles RLS for Super-Admins to edit their own profiles and manage others
-- Super admins should have full access to profiles
DROP POLICY IF EXISTS "super_admins_manage_all_profiles" ON public.profiles;
CREATE POLICY "super_admins_manage_all_profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'super_admin'::app_role OR ur.is_super_admin = true)
  )
);
