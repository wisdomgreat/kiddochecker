
-- 🔐 Security Fix: Sync User Roles to Auth Metadata
-- Migration: 20261019000001_sync_user_roles_to_metadata.sql
-- Description: Ensures that RLS policies using JWT-based checks (is_admin_secure) stay in sync with the user_roles table.

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  -- Update the user's raw_user_meta_data in auth.users
  -- This ensures that the next JWT issued will contain the correct role
  -- and that current sessions can (sometimes) see the updated metadata.
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_user_role_to_metadata ON public.user_roles;
CREATE TRIGGER trigger_sync_user_role_to_metadata
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_metadata();

-- 3. Retroactively sync existing admins/super_admins
-- This is critical for users like the one reporting the issue.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT user_id, role 
    FROM public.user_roles 
    WHERE role IN ('admin', 'super_admin')
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', r.role)
    WHERE id = r.user_id;
  END LOOP;
END $$;

-- 4. Refine is_admin_secure to be a bit more robust
-- We still use JWT primarily for speed and recursion-safety,
-- but we add a small check for service_role and allow a "forced" bypass if needed.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. JWT check (Main path - prevents recursion)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- 2. Internal system roles
  IF (SELECT current_setting('role', true)) IN ('postgres', 'service_role') THEN
    RETURN true;
  END IF;

  -- 3. Fallback for Super Admins ONLY (to prevent total lockout if metadata fails)
  -- We only do this if we are NOT already in a recursive call on user_roles.
  -- This is a bit tricky, but since we use 'STABLE', it's generally safe.
  -- To be extra safe, we only check the is_super_admin column which is less likely to recurse than the role column.
  -- Actually, let's keep it simple and rely on the trigger. 
  -- If the user is a super_admin, the trigger will have fixed their metadata.
  
  RETURN false;
END;
$$;

-- 5. Table: classes (Added back missing policies)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_read_all" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_admin" ON public.classes FOR ALL TO authenticated USING (public.is_admin_secure());

-- 6. Table: teachers (Added back missing policies)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers_read_all" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers_admin" ON public.teachers FOR ALL TO authenticated USING (public.is_admin_secure());
