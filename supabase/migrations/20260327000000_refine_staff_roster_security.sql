
-- 🛡️ Security Sweep: Refine get_staff_members to exclude regular_user
-- Description: Ensures congregation members (regular_user) do not appear in the internal staff roster.

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
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk', 'regular_user')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;
