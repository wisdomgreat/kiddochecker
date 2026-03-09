
-- Temporary function to check if a user exists in auth.users
CREATE OR REPLACE FUNCTION public.debug_user_info(p_email text)
RETURNS TABLE(user_exists boolean, email_confirmed boolean, has_profile boolean, user_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_confirmed timestamp with time zone;
BEGIN
    SELECT id, email_confirmed_at INTO v_user_id, v_confirmed FROM auth.users WHERE email = p_email;
    
    RETURN QUERY
    SELECT 
        v_user_id IS NOT NULL,
        v_confirmed IS NOT NULL,
        EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id),
        (SELECT role::text FROM public.user_roles WHERE user_id = v_user_id);
END;
$$;
