
-- ============================================================
-- Migration: Secure Organization Procedures
-- Date: 2026-02-25
-- ============================================================

-- Function: create_organization
-- Fix: Only super_admins or authenticated users during initial setup should create organizations
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  font_family TEXT DEFAULT 'Inter',
  creator_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_count INTEGER;
BEGIN
  -- Check if any organization already exists
  SELECT count(*) INTO org_count FROM public.organization_settings;
  
  -- If an organization already exists, require super_admin role
  IF org_count > 0 THEN
    IF NOT (SELECT is_admin_secure()) THEN
      RAISE EXCEPTION 'Unauthorized: Only super admins can create additional organizations';
    END IF;
  END IF;
  
  -- Use auth.uid() if creator_id is not provided
  IF creator_id IS NULL THEN
    creator_id := auth.uid();
  END IF;

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

-- Function: update_organization_logo
-- Fix: Only admins can update the organization logo
CREATE OR REPLACE FUNCTION public.update_organization_logo(
  org_id UUID,
  logo_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check
  IF NOT (SELECT is_admin_secure()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update organization logo';
  END IF;

  UPDATE public.organization_settings
  SET logo_url = logo_url,
      updated_at = now()
  WHERE id = org_id;
END;
$$;
