
-- 🛡️ Security Fix: Robust Parent Lookup for Kiosk
-- Migration: 20261019000003_robust_kiosk_lookup.sql
-- Description: Makes the parent lookup more robust by ignoring formatting characters in both the search value and the stored phone number.

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
DECLARE
  v_clean_search text;
BEGIN
  -- Clean the search value (remove non-digits if it looks like a phone number)
  v_clean_search := regexp_replace(p_search_val, '\D', '', 'g');
  
  -- If the cleaned search is empty (e.g. searching by name), use the original search val
  IF v_clean_search = '' THEN
    v_clean_search := p_search_val;
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.phone
  FROM public.profiles p
  WHERE (
      -- Cleaned phone match
      regexp_replace(p.phone, '\D', '', 'g') ILIKE '%' || v_clean_search || '%'
      -- Or name match
      OR p.first_name ILIKE '%' || p_search_val || '%' 
      OR p.last_name ILIKE '%' || p_search_val || '%'
      -- Or original phone match (just in case)
      OR p.phone ILIKE '%' || p_search_val || '%'
    )
    AND p.security_pin = p_pin
  LIMIT 5;
END;
$$;

-- Ensure permissions are correct
GRANT EXECUTE ON FUNCTION public.get_parent_for_kiosk(text, text) TO anon, authenticated, service_role;
