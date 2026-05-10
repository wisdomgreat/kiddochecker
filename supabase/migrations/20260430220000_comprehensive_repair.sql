-- 🛠️ COMPREHENSIVE DB REPAIR: Recursion Break & Data Restoration
-- This migration resolves infinite recursion and restores missing columns to staff/user RPCs.

-- 1. Break Infinite Recursion in Admin Checks
-- We use a pure SQL function that DOES NOT call policies on tables it queries.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  );
$$;

-- 2. Repair user_roles policies to use the secure check
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

CREATE POLICY "Allow view own role" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.is_admin_secure());

CREATE POLICY "Allow admin manage all" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.is_admin_secure());

-- 3. Restore get_staff_members with ALL expected columns
DROP FUNCTION IF EXISTS public.get_staff_members();
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text,
  department text,
  specialties text[],
  max_hours_per_week integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: Only staff or admins can view the roster.
  IF NOT (public.is_admin_secure()) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = auth.uid() 
    AND role IN ('staff', 'teacher', 'teacher_assistant')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can view the roster.';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      CASE 
        WHEN auth.uid() = ur.user_id THEN p.staff_pin::TEXT
        ELSE NULL -- PIN is sensitive: only owner can see it
      END as staff_pin,
      p.avatar_url::TEXT,
      p.photo_url::TEXT,
      p.department::TEXT,
      p.specialties,
      p.max_hours_per_week
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk', 'regular_user')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 4. Restore get_users_with_roles with ALL columns
DROP FUNCTION IF EXISTS public.get_users_with_roles();
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  created_at timestamptz,
  address text,
  city text,
  state text,
  zip text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  children_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can see the full user list
  IF NOT (public.is_admin_secure()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      COALESCE(p.phone, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      COALESCE(ur.is_volunteer, false),
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      au.created_at,
      p.address::text,
      p.city::text,
      p.state::text,
      p.zip_code::text as zip,
      p.gender::text,
      p.occupation::text,
      p.emergency_contact_name::text,
      p.emergency_contact_phone::text,
      (SELECT count(*)::integer FROM public.children c WHERE c.parent_id = ur.user_id) as children_count
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 5. Final Grant permissions
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
