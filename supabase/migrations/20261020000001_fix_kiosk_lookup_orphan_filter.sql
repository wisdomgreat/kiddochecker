-- Fix: Filter out deleted/orphaned profiles from kiosk parent lookup
-- Migration: 20261020000001_fix_kiosk_lookup_orphan_filter.sql
-- Description: Prevent stale/deleted profiles from appearing in kiosk login by
--   1. Requiring profile to have a valid user_roles entry (not deleted)
--   2. Accepting optional org_id parameter (backward-compatible override)

-- Drop old function signatures (2-arg version)
DROP FUNCTION IF EXISTS public.get_parent_for_kiosk(text, text);

-- Create new 3-arg version (org_id aware)
CREATE OR REPLACE FUNCTION public.get_parent_for_kiosk(
  p_search_val text,
  p_pin text,
  p_org_id text DEFAULT NULL
)
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
  -- CRITICAL FIX: Only return profiles that have an active user_roles entry.
  -- Accounts deleted via admin portal lose their user_roles row (cascade delete),
  -- so this filter prevents ghost/stale profiles from appearing in the kiosk.
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'parent'
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
    -- Exclude explicitly inactive accounts
    AND (p.is_active IS NULL OR p.is_active = TRUE)
  LIMIT 5;
END;
$$;

-- Ensure permissions are correct (both 2-arg and 3-arg via default)
GRANT EXECUTE ON FUNCTION public.get_parent_for_kiosk(text, text, text) TO anon, authenticated, service_role;
