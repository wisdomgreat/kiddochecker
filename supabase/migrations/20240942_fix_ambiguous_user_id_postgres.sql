
-- First, let's fix the create_organization function to avoid ambiguous column reference
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

-- Also fix the create_user_role function to be more explicit
CREATE OR REPLACE FUNCTION public.create_user_role(
  p_user_id UUID, 
  p_role app_role DEFAULT 'parent'::app_role, 
  p_is_super_admin BOOLEAN DEFAULT false,
  p_is_volunteer BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_role_id UUID;
BEGIN
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_super_admin,
    is_volunteer
  )
  VALUES (
    p_user_id,
    p_role,
    p_is_super_admin,
    p_is_volunteer
  )
  RETURNING id INTO new_role_id;
  
  RETURN new_role_id;
END;
$$;
