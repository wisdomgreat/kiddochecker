
-- Create functions for events management
CREATE OR REPLACE FUNCTION public.get_upcoming_events(limit_count integer DEFAULT 5)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  organizer text,
  is_public boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.location,
    e.organizer,
    e.is_public
  FROM 
    public.events e
  WHERE 
    e.start_date >= current_date
  ORDER BY 
    e.start_date ASC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_events()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  organizer text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.location,
    e.organizer,
    e.is_public,
    e.created_at,
    e.updated_at
  FROM 
    public.events e
  ORDER BY 
    e.start_date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_event(
  p_title text,
  p_description text,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_location text,
  p_organizer text,
  p_is_public boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.events (
    title,
    description,
    start_date,
    end_date,
    location,
    organizer,
    is_public
  ) VALUES (
    p_title,
    p_description,
    p_start_date,
    p_end_date,
    p_location,
    p_organizer,
    p_is_public
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_event(
  p_id uuid,
  p_title text,
  p_description text,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_location text,
  p_organizer text,
  p_is_public boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.events
  SET
    title = p_title,
    description = p_description,
    start_date = p_start_date,
    end_date = p_end_date,
    location = p_location,
    organizer = p_organizer,
    is_public = p_is_public,
    updated_at = now()
  WHERE
    id = p_id;
    
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_event(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.events
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles
  SET
    role = p_role::app_role,
    updated_at = now()
  WHERE
    user_id = p_user_id;
    
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_super_admin_status(
  p_user_id uuid,
  p_is_super_admin boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles
  SET
    is_super_admin = p_is_super_admin,
    updated_at = now()
  WHERE
    user_id = p_user_id;
    
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id uuid,
  p_role text,
  p_is_super_admin boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- First check if user already has a role
  SELECT id INTO v_role_id FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
  
  IF v_role_id IS NULL THEN
    -- Insert new role
    INSERT INTO public.user_roles (user_id, role, is_super_admin)
    VALUES (p_user_id, p_role::app_role, p_is_super_admin)
    RETURNING id INTO v_role_id;
  ELSE
    -- Update existing role
    UPDATE public.user_roles
    SET 
      role = p_role::app_role,
      is_super_admin = p_is_super_admin
    WHERE id = v_role_id;
  END IF;
  
  RETURN v_role_id;
END;
$$;
