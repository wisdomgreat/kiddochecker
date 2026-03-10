-- Migration: Fix Kiosk onboarding role and allow Admins to manage roles
-- Date: 2026-03-10

-- 1. Update handle_new_user to correctly handle device/kiosk users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Logic to assign the correct role
  IF (NEW.raw_user_meta_data->>'is_device')::boolean IS TRUE THEN
    -- It's a kiosk/device user
    INSERT INTO public.user_roles (user_id, role, verification_status, verified_at)
    VALUES (NEW.id, 'kiosk'::app_role, 'verified', NOW())
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS TRUE THEN
    -- Organization creator; role will be assigned separately
    NULL;
  ELSE
    -- Default role is parent for regular signups
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Update protect_user_role trigger to allow administrative role changes
-- Currently, it blocks anyone who is not a super_admin from updating roles.
-- If auth.uid() is null (Service Role / Supabase Dashboard), it should pass.
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if:
  -- 1. Update is being performed by the service role / administrative context (auth.uid() is null)
  -- 2. Update is being performed by a Super Admin
  IF (
    auth.uid() IS NOT NULL AND 
    NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'super_admin' OR ur.is_super_admin = true)
    )
  ) THEN
    -- Ensure role and is_super_admin must not change if not an administrator
    IF NEW.role != OLD.role OR NEW.is_super_admin != OLD.is_super_admin THEN
        NEW.role := OLD.role;
        NEW.is_super_admin := OLD.is_super_admin;
        NEW.user_id := OLD.user_id; -- Prevent ownership change
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
