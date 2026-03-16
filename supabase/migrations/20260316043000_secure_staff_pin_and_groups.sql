-- 1. FIX PIN PROTECTION TRIGGER
-- Allow Admins to change PINs for everyone except Super-Admins.
CREATE OR REPLACE FUNCTION protect_staff_pin()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role text;
  v_target_is_super_admin boolean;
BEGIN
  -- If staff_pin is changing
  IF (NEW.staff_pin IS DISTINCT FROM OLD.staff_pin) THEN
    -- If no auth context (e.g., service role, background trigger), allow it
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- 1. Get Actor's Role
    SELECT role::text INTO v_actor_role 
    FROM public.user_roles 
    WHERE user_id = auth.uid();

    -- 2. Check if Target is Super Admin
    SELECT (role::text = 'super_admin' OR is_super_admin = true) INTO v_target_is_super_admin
    FROM public.user_roles
    WHERE user_id = NEW.id;

    -- 3. Apply logic
    -- Super Admin can do everything
    IF v_actor_role = 'super_admin' THEN
      RETURN NEW;
    END IF;

    -- Admin can do everything EXCEPT super admin
    IF v_actor_role = 'admin' THEN
      IF v_target_is_super_admin THEN
        RAISE EXCEPTION 'Admins cannot modify a Super-Admin Identity PIN';
      END IF;
      RETURN NEW;
    END IF;

    -- Everyone else: Forbidden
    RAISE EXCEPTION 'Only Administrators can modify a Staff Identity PIN';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SECURE STAFF PIN VISIBILITY
-- Update get_staff_members to NOT return PINs unless the viewer is the owner.
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
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 3. SECURE STAFF GROUPS RLS
ALTER TABLE public.staff_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_group_members ENABLE ROW LEVEL SECURITY;

-- Admins/Super-Admins manage groups
DROP POLICY IF EXISTS "Admins manage groups" ON public.staff_groups;
CREATE POLICY "Admins manage groups" ON public.staff_groups
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Everyone can view groups
DROP POLICY IF EXISTS "Everyone view groups" ON public.staff_groups;
CREATE POLICY "Everyone view groups" ON public.staff_groups
FOR SELECT TO authenticated
USING (true);

-- Admins/Super-Admins manage group members
DROP POLICY IF EXISTS "Admins manage group members" ON public.staff_group_members;
CREATE POLICY "Admins manage group members" ON public.staff_group_members
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Everyone can view group members
DROP POLICY IF EXISTS "Everyone view group members" ON public.staff_group_members;
CREATE POLICY "Everyone view group members" ON public.staff_group_members
FOR SELECT TO authenticated
USING (true);
