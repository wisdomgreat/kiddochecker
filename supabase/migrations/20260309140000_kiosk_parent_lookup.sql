
-- Migration: Secure Parent Lookup for Kiosk
-- Since Kiosk search happens before authentication, we'll use a security definer function.
-- This prevents the need to make the 'profiles' table publicly readable.

CREATE OR REPLACE FUNCTION public.get_parent_for_kiosk(p_search_val text, p_pin text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.phone
  FROM public.profiles p
  WHERE (p.phone ILIKE '%' || p_search_val || '%' 
     OR p.first_name ILIKE '%' || p_search_val || '%' 
     OR p.last_name ILIKE '%' || p_search_val || '%')
    AND p.security_pin = p_pin
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_parent_for_kiosk(text, text) TO anon, authenticated;
