
CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(ur)) FROM (
    SELECT user_id, role, is_super_admin, created_at, verification_status 
    FROM public.user_roles
  ) ur;
$$;
