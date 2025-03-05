
-- Stored procedure to create an organization
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  font_family TEXT DEFAULT 'Inter',
  creator_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organization_settings (
    name, 
    primary_color, 
    font_family, 
    created_by
  )
  VALUES (
    org_name, 
    primary_color, 
    font_family, 
    creator_id
  )
  RETURNING id INTO new_org_id;
  
  RETURN new_org_id;
END;
$$;

-- Stored procedure to update organization logo
CREATE OR REPLACE FUNCTION public.update_organization_logo(
  org_id UUID,
  logo_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.organization_settings
  SET logo_url = logo_url
  WHERE id = org_id;
END;
$$;
