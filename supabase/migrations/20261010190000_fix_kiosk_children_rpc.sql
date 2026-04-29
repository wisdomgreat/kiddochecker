-- Fix get_children_for_kiosk RPC to match actual children table schema
-- Current children table uses 'age' instead of 'gender' and 'date_of_birth'

DROP FUNCTION IF EXISTS public.get_children_for_kiosk(p_parent_id uuid, p_pin text);
DROP FUNCTION IF EXISTS public.get_children_for_kiosk(uuid, text);

CREATE OR REPLACE FUNCTION public.get_children_for_kiosk(p_parent_id uuid, p_pin text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  age integer,
  allergies text,
  notes text,
  parent_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Verify the PIN matches for the given parent
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_parent_id AND security_pin = p_pin
  ) THEN
    RETURN;
  END IF;

  -- Return matching children with actual schema columns
  RETURN QUERY
  SELECT c.id, c.first_name, c.last_name, c.age, c.allergies, c.notes, c.parent_id
  FROM public.children c
  WHERE c.parent_id = p_parent_id;
END;
$$;

-- Grant access to the kiosk role
GRANT EXECUTE ON FUNCTION public.get_children_for_kiosk(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_children_for_kiosk(uuid, text) TO service_role;
