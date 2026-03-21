-- 📈 REPAIR: Expand User Management RPC
-- Description: Fixes the structural mismatch by using the correct column name 'zip_code' and adding back 'children_count'.

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
      p.zip_code::text as zip, -- Correct column is zip_code
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

GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO service_role;
