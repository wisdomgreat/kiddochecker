
-- Stored procedure to create a family
CREATE OR REPLACE FUNCTION public.create_family(family_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_family_id UUID;
BEGIN
  INSERT INTO public.families (name)
  VALUES (family_name)
  RETURNING id INTO new_family_id;
  
  RETURN new_family_id;
END;
$$;

-- Stored procedure to link a parent to a child
CREATE OR REPLACE FUNCTION public.link_parent_child(
  p_parent_id UUID,
  p_child_id UUID,
  p_relationship TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.parent_children (parent_id, child_id, relationship)
  VALUES (p_parent_id, p_child_id, p_relationship);
END;
$$;
