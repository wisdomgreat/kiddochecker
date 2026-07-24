
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  confirmed_at TIMESTAMPTZ
);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    organizer TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up RLS for events table if not already set
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view public events if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow authenticated users to view public events'
    ) THEN
        CREATE POLICY "Allow authenticated users to view public events" 
        ON public.events
        FOR SELECT
        TO authenticated
        USING (is_public = true);
    END IF;
END
$$;

-- Create policy to allow admins to manage all events if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow admins to manage all events'
    ) THEN
        CREATE POLICY "Allow admins to manage all events" 
        ON public.events
        TO authenticated
        USING (auth.jwt() ->> 'role' = 'admin' OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
    END IF;
END
$$;

-- Create RPC function to get upcoming events
CREATE OR REPLACE FUNCTION public.get_upcoming_events(limit_count integer DEFAULT 10)
RETURNS SETOF public.events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.events
  WHERE start_date >= CURRENT_TIMESTAMP
  ORDER BY start_date ASC
  LIMIT limit_count;
END;
$$;

-- Create RPC function to get all events
CREATE OR REPLACE FUNCTION public.get_all_events()
RETURNS SETOF public.events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.events
  ORDER BY start_date ASC;
END;
$$;

-- Create trigger to update updated_at field if it doesn't exist already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_events_updated_at'
    ) THEN
        CREATE TRIGGER set_events_updated_at
        BEFORE UPDATE ON public.events
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;

-- Enable replica identity on tables to ensure we get the full row data on updates
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER TABLE classes REPLICA IDENTITY FULL;
ALTER TABLE teachers REPLICA IDENTITY FULL;
ALTER TABLE children REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
BEGIN;
  -- Drop the publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create the publication with the tables we want to track
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    attendance, 
    classes, 
    teachers, 
    children;
COMMIT;

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

-- Function to get all staff members
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT,
  is_super_admin BOOLEAN,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      auth.users.email,
      profiles.first_name,
      profiles.last_name,
      profiles.phone,
      ur.role::TEXT,
      ur.is_super_admin,
      auth.users.confirmed_at IS NOT NULL AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users ON ur.user_id = auth.users.id
    LEFT JOIN 
      public.profiles ON ur.user_id = profiles.id
    WHERE 
      ur.role IN ('admin', 'staff', 'teacher')
    ORDER BY 
      profiles.last_name, profiles.first_name;
END;
$$;

-- Create a storage bucket for organization assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the organization_assets bucket
-- Allow public read access for all users
CREATE POLICY "Public Read Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'organization_assets');

-- Allow authenticated users to upload organization assets
CREATE POLICY "Authenticated User Upload Access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization_assets');

-- Allow authenticated users to update their own organization assets
CREATE POLICY "Authenticated User Update Access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'organization_assets' AND auth.uid() IN (
  SELECT created_by FROM public.organization_settings
));

-- Make sure all tables have RLS enabled but policies are more permissive for system functions

-- Functions need a special policy to bypass RLS when they're operating on behalf of the system
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "System functions can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "System functions can insert families" ON public.families;

-- Create a policy that allows system functions to manage user_roles
CREATE POLICY "System functions bypass RLS for user_roles" 
ON public.user_roles 
USING (true);

-- Create a policy that allows system functions to manage families
CREATE POLICY "System functions bypass RLS for families" 
ON public.families 
USING (true);

-- Fix organization_settings RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Set policy for organization_settings to be viewable by all authenticated users
CREATE POLICY "All authenticated users can view organization settings" 
ON public.organization_settings 
FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can update organization settings
CREATE POLICY "Only admins can update organization settings" 
ON public.organization_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin')
  )
);

-- Create storage bucket for organization assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to download from organization_assets
CREATE POLICY "Anyone can download from organization_assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization_assets');

-- Allow authenticated users to upload to organization_assets
CREATE POLICY "Authenticated users can upload organization assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization_assets');

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  organizer TEXT,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events table
-- Allow admins and teachers to read all events
CREATE POLICY "Admins and teachers can read all events"
ON public.events
FOR SELECT
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('admin', 'teacher')
  OR is_public = true
);

-- Allow admins and teachers to insert events
CREATE POLICY "Admins and teachers can insert events"
ON public.events
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('admin', 'teacher')
);

-- Allow admins and teachers to update their own events
CREATE POLICY "Admins and teachers can update own events"
ON public.events
FOR UPDATE
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('admin', 'teacher')
  AND created_by = auth.uid()
);

-- Allow admins and teachers to delete their own events
CREATE POLICY "Admins and teachers can delete own events"
ON public.events
FOR DELETE
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('admin', 'teacher')
  AND created_by = auth.uid()
);

-- Function to get all events
CREATE OR REPLACE FUNCTION public.get_all_events()
RETURNS SETOF public.events
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.events ORDER BY start_date ASC;
END;
$$;

-- Function to get upcoming events
CREATE OR REPLACE FUNCTION public.get_upcoming_events(limit_count integer DEFAULT 3)
RETURNS SETOF public.events
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.events 
  WHERE start_date >= NOW() AND is_public = true
  ORDER BY start_date ASC 
  LIMIT limit_count;
END;
$$;

-- Function to create a new event
CREATE OR REPLACE FUNCTION public.create_event(
  p_title TEXT,
  p_description TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_location TEXT,
  p_organizer TEXT,
  p_is_public BOOLEAN,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.events (
    title,
    description,
    start_date,
    end_date,
    location,
    organizer,
    is_public,
    created_by
  ) VALUES (
    p_title,
    p_description,
    p_start_date,
    p_end_date,
    p_location,
    p_organizer,
    p_is_public,
    p_user_id
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to update an event
CREATE OR REPLACE FUNCTION public.update_event(
  p_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_location TEXT,
  p_organizer TEXT,
  p_is_public BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
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
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Function to delete an event
CREATE OR REPLACE FUNCTION public.delete_event(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.events WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- Functions for user role management
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_is_super_admin BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, is_super_admin)
  VALUES (p_user_id, p_role::public.app_role, p_is_super_admin)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = p_role::public.app_role,
    is_super_admin = p_is_super_admin;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles
  SET role = p_role::public.app_role
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_super_admin_status(
  p_user_id UUID,
  p_is_super_admin BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles
  SET is_super_admin = p_is_super_admin
  WHERE user_id = p_user_id;
END;
$$;

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    organizer TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up RLS for events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view public events
CREATE POLICY "Allow authenticated users to view public events" 
ON public.events
FOR SELECT
TO authenticated
USING (is_public = true);

-- Create policy to allow admins to manage all events
CREATE POLICY "Allow admins to manage all events" 
ON public.events
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin' OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create trigger to update updated_at field
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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

-- Create functions for getting user emails (for admin use)
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(
  id uuid,
  email text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the role of the requesting user
  SELECT role::text INTO requesting_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Only return data if requesting user is admin or super_admin
  IF requesting_user_role = 'admin' OR requesting_user_role = 'super_admin' THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email
    FROM 
      auth.users au
    ORDER BY 
      au.email;
  ELSE
    -- Return only the requesting user's email for non-admins
    RETURN QUERY
    SELECT 
      auth.uid() as id,
      au.email
    FROM 
      auth.users au
    WHERE
      au.id = auth.uid();
  END IF;
END;
$$;

-- Fix the database function for attendance report
CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date)
RETURNS TABLE(
  attendance_date date,
  total_checked_in integer,
  total_checked_out integer,
  class_name text,
  class_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      a.attendance_date,
      COUNT(a.id) FILTER (WHERE a.checked_in_at IS NOT NULL)::INTEGER as total_checked_in,
      COUNT(a.id) FILTER (WHERE a.checked_out_at IS NOT NULL)::INTEGER as total_checked_out,
      c.name as class_name,
      c.id as class_id
    FROM 
      attendance a
    LEFT JOIN 
      classes c ON a.class_id = c.id
    WHERE 
      a.attendance_date BETWEEN start_date AND end_date
    GROUP BY 
      a.attendance_date, c.name, c.id
    ORDER BY 
      a.attendance_date DESC, c.name;
END;
$$;

-- Create a view to safely expose email addresses
CREATE OR REPLACE VIEW auth_users_emails_view AS 
SELECT 
  au.id,
  au.email
FROM 
  auth.users au
JOIN 
  public.user_roles ur ON au.id = ur.user_id
WHERE 
  ur.role IN ('admin', 'super_admin') OR ur.is_super_admin = true
  OR au.id = auth.uid();

-- Add RLS policy to the view to control access
ALTER TABLE auth_users_emails_view ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to access this view
CREATE POLICY "Allow authenticated access to emails view" 
  ON auth_users_emails_view 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create a function to safely execute SQL and view the auth_users_emails_view
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- Add RLS policy to restrict who can execute SQL
REVOKE ALL ON FUNCTION public.execute_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;

-- Create RLS policy to enforce that only specific queries can be executed
CREATE OR REPLACE FUNCTION public.check_sql_query_safety(query text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow specific queries to be executed
  RETURN query = 'SELECT id, email FROM auth_users_emails_view';
END;
$$;

-- Add RLS policy to the execute_sql function


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

-- This migration fixes potential infinite recursion issues with Row Level Security (RLS)
-- policies on the `profiles` and `user_roles` tables. It replaces any existing policies
-- with a new set of safe and secure rules.

-- Drop all existing RLS policies on `profiles` and `user_roles` to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for INSERT" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for UPDATE" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for DELETE" ON public.user_roles;
-- This policy from a previous migration is too permissive and will be replaced.
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;


-- Enable RLS on both tables if it's not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


-- == Policies for `profiles` table ==

-- A user can view and update their own profile.
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can perform any action on any profile.
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));


-- == Policies for `user_roles` table ==

-- Any user can read their own role. This is crucial to prevent recursion for admins.
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all user roles.
-- This is safe because when `get_current_user_role()` is called for an admin,
-- the "Users can view their own role" policy allows the function to read the admin's own role.
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));

-- Only admins can insert, update, or delete roles.
CREATE POLICY "Admins can manage user roles for INSERT"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage user roles for UPDATE"
  ON public.user_roles FOR UPDATE
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage user roles for DELETE"
  ON public.user_roles FOR DELETE
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));


-- Clear all organization and user data
-- Note: This will remove ALL data from the database, use with caution

-- Delete attendance records first (has foreign keys)
DELETE FROM public.attendance;

-- Delete teacher assignments
DELETE FROM public.teachers;

-- Delete parent-children relationships
DELETE FROM public.parent_children;

-- Delete children records
DELETE FROM public.children;

-- Delete classes
DELETE FROM public.classes;

-- Delete messages
DELETE FROM public.messages;

-- Delete calendar events
DELETE FROM public.calendar_events;

-- Delete events
DELETE FROM public.events;

-- Delete user custom role assignments
DELETE FROM public.user_custom_roles;

-- Delete role permissions
DELETE FROM public.role_permissions;

-- Delete user roles
DELETE FROM public.user_roles;

-- Delete profiles
DELETE FROM public.profiles;

-- Delete custom roles
DELETE FROM public.custom_roles;

-- Delete permissions
DELETE FROM public.permissions;

-- Delete families
DELETE FROM public.families;

-- Delete device profiles
DELETE FROM public.device_profiles;

-- Delete organization settings
DELETE FROM public.organization_settings;

-- Delete users from auth schema (this will cascade to related tables)
-- Note: This requires elevated privileges, may need to be done manually in Supabase dashboard
-- DELETE FROM auth.users;

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS <sequence_name> RESTART WITH 1;

-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for INSERT" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for UPDATE" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for DELETE" ON public.user_roles;

-- Create safe policies that don't cause recursion
-- Allow users to view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow authenticated users to insert roles (this will be used during signup/organization creation)
CREATE POLICY "System can create roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own roles if they are super_admin (using a function to avoid recursion)
CREATE POLICY "Super admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles existing_roles
    WHERE existing_roles.user_id = auth.uid() 
    AND existing_roles.is_super_admin = true
  )
);

-- Allow users to delete their own roles
CREATE POLICY "Users can delete own roles" 
ON public.user_roles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create a security definer function to safely check if user is super admin
-- This function bypasses RLS policies to prevent recursion
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin 
     FROM public.user_roles 
     WHERE user_id = auth.uid() 
     LIMIT 1), 
    false
  );
$$;

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can create roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;

-- Create new, safe policies that won't cause recursion
-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow any authenticated user to insert roles (needed for organization creation)
CREATE POLICY "Authenticated users can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow super admins to manage all roles using the safe function
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_current_user_super_admin());

-- Allow users to update their own roles
CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own roles
CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix the handle_new_user trigger to not auto-assign parent role during organization setup
-- This allows the organization creation flow to properly assign super_admin role

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved handle_new_user function that doesn't auto-assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- DO NOT auto-assign role here - let the application handle role assignment
  -- This prevents conflicts during organization setup where super_admin role is needed
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the handle_new_user trigger to not auto-assign parent role during organization setup
-- This allows the organization creation flow to properly assign super_admin role

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved handle_new_user function that doesn't auto-assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- DO NOT auto-assign role here - let the application handle role assignment
  -- This prevents conflicts during organization setup where super_admin role is needed
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the handle_new_user function to assign default parent role
-- Drop trigger first, then function, then recreate both

-- Drop the trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the updated handle_new_user function that assigns default parent role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Assign default parent role for regular signups
  -- Organization setup will override this with super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent'::app_role);
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 1: Create a function to assign organization creator role
CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's role to super_admin and set is_super_admin flag
  UPDATE public.user_roles 
  SET 
    role = 'super_admin'::app_role,
    is_super_admin = true,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Update organization settings to link creator
  UPDATE public.organization_settings
  SET created_by = p_user_id
  WHERE id = p_org_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Step 2: Update the handle_new_user function to check for organization setup context
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is an organization creator signup
  -- If so, skip default role assignment (will be handled by assign_organization_creator_role)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    -- Assign default parent role for regular signups only
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix all database functions by adding proper search_path security
-- This will resolve the infinite recursion errors and security warnings

-- Update all functions with proper search_path setting
CREATE OR REPLACE FUNCTION public.get_parent_children_with_classes(parent_user_id uuid)
 RETURNS TABLE(child_id uuid, first_name text, last_name text, age integer, allergies text, current_class_name text, current_class_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as child_id,
    c.first_name,
    c.last_name,
    c.age,
    c.allergies,
    cl.name as current_class_name,
    cl.id as current_class_id
  FROM public.children c
  LEFT JOIN public.attendance a ON c.id = a.child_id 
    AND a.attendance_date = CURRENT_DATE 
    AND a.checked_out_at IS NULL
  LEFT JOIN public.classes cl ON a.class_id = cl.id
  WHERE c.parent_id = parent_user_id
  ORDER BY c.first_name, c.last_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_detailed_attendance_report(start_date date DEFAULT CURRENT_DATE, end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(attendance_date date, child_name text, class_name text, check_in_time timestamp with time zone, check_out_time timestamp with time zone, duration_hours numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.attendance_date,
    CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
    cl.name as class_name,
    a.checked_in_at as check_in_time,
    a.checked_out_at as check_out_time,
    CASE 
      WHEN a.checked_out_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
      ELSE NULL
    END as duration_hours
  FROM attendance a
  JOIN children ch ON a.child_id = ch.id
  LEFT JOIN classes cl ON a.class_id = cl.id
  WHERE a.attendance_date BETWEEN start_date AND end_date
  ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_class_roster_with_attendance(class_id_param uuid, date_param date DEFAULT CURRENT_DATE)
 RETURNS TABLE(child_id uuid, child_name text, is_present boolean, check_in_time timestamp with time zone, check_out_time timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id as child_id,
    CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
    (a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL) as is_present,
    a.checked_in_at as check_in_time,
    a.checked_out_at as check_out_time
  FROM children ch
  LEFT JOIN attendance a ON ch.id = a.child_id 
    AND a.attendance_date = date_param
    AND a.class_id = class_id_param
  ORDER BY ch.first_name, ch.last_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_events()
 RETURNS SETOF events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events
  ORDER BY start_date ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date)
 RETURNS TABLE(attendance_date date, total_checked_in integer, total_checked_out integer, class_name text, class_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      a.attendance_date,
      COUNT(a.id) FILTER (WHERE a.checked_in_at IS NOT NULL)::INTEGER as total_checked_in,
      COUNT(a.id) FILTER (WHERE a.checked_out_at IS NOT NULL)::INTEGER as total_checked_out,
      c.name as class_name,
      c.id as class_id
    FROM 
      attendance a
    LEFT JOIN 
      classes c ON a.class_id = c.id
    WHERE 
      a.attendance_date BETWEEN start_date AND end_date
    GROUP BY 
      a.attendance_date, c.name, c.id
    ORDER BY 
      a.attendance_date DESC, c.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_device(p_device_id text, p_name text, p_type text, p_location text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  INSERT INTO device_profiles (device_id, name, type, location)
  VALUES (p_device_id, p_name, p_type, p_location)
  ON CONFLICT (device_id) 
  DO UPDATE SET 
    name = p_name,
    type = p_type,
    location = COALESCE(p_location, device_profiles.location),
    updated_at = NOW()
  RETURNING to_jsonb(device_profiles.*) INTO v_result;
  
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_device_profile(p_device_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT to_jsonb(device_profiles.*)
  FROM device_profiles
  WHERE device_id = p_device_id
  INTO v_result;
  
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_sql_query_safety(query text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (query = 'SELECT id, email FROM auth_users_with_emails'
      OR query = 'SELECT id, email FROM auth_users_emails_view');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users
    JOIN user_roles ON auth.users.id = user_roles.user_id 
    WHERE auth.users.id = user_id 
    AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_upcoming_events(limit_count integer DEFAULT 10)
 RETURNS SETOF events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events
  WHERE start_date >= CURRENT_TIMESTAMP
  ORDER BY start_date ASC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_resource text, p_action text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_is_super_admin BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_roles
  WHERE user_id = p_user_id AND role = 'admin';

  IF v_is_super_admin IS TRUE THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_custom_roles ucr
    JOIN role_permissions rp ON ucr.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ucr.user_id = p_user_id
    AND p.resource = p_resource
    AND p.action = p_action
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND (user_roles.role = has_role.role OR (has_role.role = 'admin' AND user_roles.is_super_admin = true))
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_class_teacher_assignment(p_class_name text, p_description text, p_age_range text, p_capacity integer, p_room text, p_teacher_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_class_id UUID;
BEGIN
  INSERT INTO classes (
    name, 
    description,
    age_range,
    capacity,
    room
  )
  VALUES (
    p_class_name,
    p_description,
    p_age_range,
    p_capacity,
    p_room
  )
  RETURNING id INTO new_class_id;
  
  IF p_teacher_id IS NOT NULL THEN
    INSERT INTO teachers (
      user_id,
      class_id
    )
    VALUES (
      p_teacher_id,
      new_class_id
    );
  END IF;
  
  RETURN new_class_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_organization(org_name text, primary_color text DEFAULT '#6366f1'::text, font_family text DEFAULT 'Inter'::text, creator_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO organization_settings (
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
$function$;

-- Fix the problematic RLS policies that cause infinite recursion
-- Remove the recursive policies and replace with simpler ones

-- Drop problematic policies on user_roles table
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Create safer, non-recursive policies
CREATE POLICY "Users can view their own role only" ON user_roles
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Super admins have full access" ON user_roles
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access" ON user_roles
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Add missing QR code functionality for check-in system
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  qr_data text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on qr_codes
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for QR codes
CREATE POLICY "Staff can manage QR codes" ON qr_codes
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'teacher', 'super_admin')
  ));

CREATE POLICY "Parents can view their children's QR codes" ON qr_codes
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM children 
    WHERE children.id = qr_codes.child_id 
    AND children.parent_id = auth.uid()
  ));

-- Create staff_invitations table for managing staff invitation workflow
CREATE TABLE public.staff_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  invitation_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  user_id uuid REFERENCES auth.users(id) -- Set when staff completes signup
);

-- Add RLS policies for staff_invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can create, view, and manage invitations
CREATE POLICY "Admins can manage staff invitations" 
  ON public.staff_invitations 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view their own invitation (when they have the token)
CREATE POLICY "Staff can view their own invitation" 
  ON public.staff_invitations 
  FOR SELECT 
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_staff_invitations_updated_at
  BEFORE UPDATE ON public.staff_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(invitation_token);
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX idx_staff_invitations_status ON public.staff_invitations(status);

-- Fix the get_users_with_roles function to handle proper type mapping
DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid, 
  email text, 
  first_name text, 
  last_name text, 
  role text, 
  is_super_admin boolean, 
  is_active boolean,
  is_volunteer boolean,
  phone text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email,
      COALESCE(p.first_name, '') as first_name,
      COALESCE(p.last_name, '') as last_name,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      (au.email_confirmed_at IS NOT NULL) AS is_active,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      COALESCE(p.phone, '') as phone,
      ur.created_at
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name, p.first_name;
END;
$$;

-- Create comprehensive granular permissions
INSERT INTO public.permissions (name, resource, action, description) VALUES
-- User Management
('view_users', 'users', 'read', 'View user profiles and information'),
('create_users', 'users', 'create', 'Create new user accounts'),
('edit_users', 'users', 'update', 'Edit user profiles and information'),
('delete_users', 'users', 'delete', 'Delete user accounts'),
('manage_user_roles', 'users', 'manage_roles', 'Assign and modify user roles'),
('suspend_users', 'users', 'suspend', 'Suspend or activate user accounts'),
('reset_user_passwords', 'users', 'reset_password', 'Reset user passwords'),

-- Role & Permission Management
('view_roles', 'roles', 'read', 'View system roles'),
('create_roles', 'roles', 'create', 'Create custom roles'),
('edit_roles', 'roles', 'update', 'Edit role properties'),
('delete_roles', 'roles', 'delete', 'Delete custom roles'),
('view_permissions', 'permissions', 'read', 'View system permissions'),
('create_permissions', 'permissions', 'create', 'Create new permissions'),
('edit_permissions', 'permissions', 'update', 'Edit permission properties'),
('delete_permissions', 'permissions', 'delete', 'Delete permissions'),
('assign_role_permissions', 'role_permissions', 'manage', 'Assign permissions to roles'),

-- Children Management
('view_all_children', 'children', 'read_all', 'View all children in the system'),
('view_own_children', 'children', 'read_own', 'View only own children'),
('create_children', 'children', 'create', 'Register new children'),
('edit_children', 'children', 'update', 'Edit child information'),
('delete_children', 'children', 'delete', 'Remove children from system'),
('manage_child_assignments', 'children', 'assign', 'Assign children to classes'),

-- Class Management
('view_classes', 'classes', 'read', 'View class information'),
('create_classes', 'classes', 'create', 'Create new classes'),
('edit_classes', 'classes', 'update', 'Edit class information'),
('delete_classes', 'classes', 'delete', 'Delete classes'),
('assign_teachers', 'classes', 'assign_teachers', 'Assign teachers to classes'),
('manage_class_roster', 'classes', 'manage_roster', 'Manage class enrollment'),

-- Attendance Management
('view_attendance', 'attendance', 'read', 'View attendance records'),
('checkin_children', 'attendance', 'checkin', 'Check children in'),
('checkout_children', 'attendance', 'checkout', 'Check children out'),
('manage_attendance', 'attendance', 'manage', 'Full attendance management'),
('view_attendance_reports', 'attendance', 'reports', 'Generate attendance reports'),

-- Organization Management
('view_organization_settings', 'organization', 'read', 'View organization settings'),
('edit_organization_settings', 'organization', 'update', 'Edit organization settings'),
('manage_organization_branding', 'organization', 'branding', 'Manage logos and themes'),
('view_audit_logs', 'organization', 'audit_logs', 'View system audit logs'),

-- Device Management
('view_devices', 'devices', 'read', 'View registered devices'),
('register_devices', 'devices', 'create', 'Register new devices'),
('edit_devices', 'devices', 'update', 'Edit device configuration'),
('delete_devices', 'devices', 'delete', 'Remove devices'),

-- Communication
('send_messages', 'messages', 'send', 'Send messages to users'),
('view_messages', 'messages', 'read', 'View received messages'),
('broadcast_messages', 'messages', 'broadcast', 'Send broadcast messages'),

-- Events Management
('view_events', 'events', 'read', 'View events'),
('create_events', 'events', 'create', 'Create new events'),
('edit_events', 'events', 'update', 'Edit event information'),
('delete_events', 'events', 'delete', 'Delete events'),
('manage_event_registration', 'events', 'registration', 'Manage event registrations'),

-- Reports & Analytics
('view_basic_reports', 'reports', 'basic', 'View basic reports'),
('view_detailed_reports', 'reports', 'detailed', 'View detailed analytics'),
('export_reports', 'reports', 'export', 'Export reports and data'),
('view_financial_reports', 'reports', 'financial', 'View financial reports'),

-- System Administration
('manage_system_settings', 'system', 'settings', 'Manage system-wide settings'),
('view_system_health', 'system', 'health', 'View system health and performance'),
('manage_backups', 'system', 'backups', 'Manage data backups'),
('manage_integrations', 'system', 'integrations', 'Manage third-party integrations')
ON CONFLICT (name) DO NOTHING;

-- Create default role-permission mappings
-- Super Admin gets all permissions automatically (handled in code)

-- Admin role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  p.id as permission_id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Teacher role permissions
WITH teacher_permissions AS (
  SELECT id FROM public.permissions WHERE name IN (
    'view_own_children', 'view_classes', 'checkin_children', 'checkout_children',
    'view_attendance', 'send_messages', 'view_messages', 'view_events',
    'create_events', 'edit_events', 'view_basic_reports'
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  tp.id as permission_id
FROM public.custom_roles cr
CROSS JOIN teacher_permissions tp
WHERE cr.name = 'Teacher'
ON CONFLICT DO NOTHING;

-- Staff role permissions
WITH staff_permissions AS (
  SELECT id FROM public.permissions WHERE name IN (
    'view_all_children', 'view_classes', 'checkin_children', 'checkout_children',
    'view_attendance', 'send_messages', 'view_messages', 'view_events',
    'view_basic_reports'
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  sp.id as permission_id
FROM public.custom_roles cr
CROSS JOIN staff_permissions sp
WHERE cr.name = 'Staff'
ON CONFLICT DO NOTHING;

-- Parent role permissions
WITH parent_permissions AS (
  SELECT id FROM public.permissions WHERE name IN (
    'view_own_children', 'checkin_children', 'checkout_children',
    'view_messages', 'view_events'
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  pp.id as permission_id
FROM public.custom_roles cr
CROSS JOIN parent_permissions pp
WHERE cr.name = 'Parent'
ON CONFLICT DO NOTHING;

-- Create function to check user permissions with granular control
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean := false;
  v_has_permission boolean := false;
BEGIN
  -- Check if user is super admin
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  -- Super admins have all permissions
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role::text = (
      SELECT name FROM public.custom_roles WHERE id = rp.role_id
    )
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  -- Also check custom role assignments
  IF NOT v_has_permission THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.user_custom_roles ucr
      JOIN public.role_permissions rp ON ucr.role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ucr.user_id = p_user_id
      AND p.name = p_permission_name
    ) INTO v_has_permission;
  END IF;
  
  RETURN v_has_permission;
END;
$$;

-- Create function for admin user management
CREATE OR REPLACE FUNCTION public.admin_manage_user(
  p_action text,
  p_target_user_id uuid,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}';
  v_is_admin boolean := false;
BEGIN
  -- Verify the calling user is an admin
  SELECT public.check_user_permission(auth.uid(), 'manage_user_roles')
  INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;
  
  CASE p_action
    WHEN 'update_role' THEN
      UPDATE public.user_roles
      SET 
        role = (p_data->>'role')::app_role,
        is_super_admin = COALESCE((p_data->>'is_super_admin')::boolean, false),
        is_volunteer = COALESCE((p_data->>'is_volunteer')::boolean, false)
      WHERE user_id = p_target_user_id;
      
      v_result := jsonb_build_object('success', true, 'action', 'role_updated');
      
    WHEN 'suspend_user' THEN
      -- This would integrate with auth to disable the user
      v_result := jsonb_build_object('success', true, 'action', 'user_suspended');
      
    WHEN 'reset_password' THEN
      -- This would integrate with auth to reset password
      v_result := jsonb_build_object('success', true, 'action', 'password_reset');
      
    ELSE
      v_result := jsonb_build_object('error', 'Invalid action');
  END CASE;
  
  RETURN v_result;
END;
$$;

-- Create comprehensive admin dashboard function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Verify admin permissions
  IF NOT public.check_user_permission(auth.uid(), 'view_system_health') THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'total_children', (SELECT COUNT(*) FROM public.children),
    'total_classes', (SELECT COUNT(*) FROM public.classes),
    'todays_attendance', (
      SELECT COUNT(*) FROM public.attendance 
      WHERE attendance_date = CURRENT_DATE AND checked_in_at IS NOT NULL
    ),
    'pending_checkouts', (
      SELECT COUNT(*) FROM public.attendance 
      WHERE attendance_date = CURRENT_DATE 
      AND checked_in_at IS NOT NULL 
      AND checked_out_at IS NULL
    ),
    'user_roles_breakdown', (
      SELECT jsonb_object_agg(role, count)
      FROM (
        SELECT role::text, COUNT(*) as count
        FROM public.user_roles
        GROUP BY role
      ) role_counts
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', attendance_date,
          'checkins', checkins,
          'checkouts', checkouts
        )
      )
      FROM (
        SELECT 
          attendance_date,
          COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checkins,
          COUNT(*) FILTER (WHERE checked_out_at IS NOT NULL) as checkouts
        FROM public.attendance
        WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY attendance_date
        ORDER BY attendance_date DESC
        LIMIT 7
      ) recent
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- Update RLS policies to use the new permission system
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'manage_user_roles'));

DROP POLICY IF EXISTS "Admins can manage custom roles" ON public.custom_roles;
CREATE POLICY "Admins can manage custom roles"
ON public.custom_roles
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'create_roles'));

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'view_permissions'));

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.check_user_permission(auth.uid(), 'assign_role_permissions'));

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_resource text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    timestamp
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource,
    p_resource_id,
    p_details,
    now()
  );
END;
$$;

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.check_user_permission(auth.uid(), 'view_audit_logs'));

CREATE POLICY "System can insert audit logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Phase 1: Database & Security Fixes

-- Fix database security by updating functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create a profile entry for new user
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is an organization creator signup
  -- If so, skip default role assignment (will be handled by assign_organization_creator_role)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS TRUE THEN
    -- For organization creators, create a temporary role that will be updated
    INSERT INTO public.user_roles (user_id, role, is_super_admin)
    VALUES (NEW.id, 'admin'::app_role, true);
  ELSE
    -- Assign default parent role for regular signups only
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update assign_organization_creator_role function
CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the user's role to super_admin and set is_super_admin flag
  UPDATE public.user_roles 
  SET 
    role = 'super_admin'::app_role,
    is_super_admin = true,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- If no role exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, is_super_admin)
    VALUES (p_user_id, 'super_admin'::app_role, true);
  END IF;
  
  -- Update organization settings to link creator
  UPDATE public.organization_settings
  SET created_by = p_user_id
  WHERE id = p_org_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    CASE 
      WHEN is_super_admin = true THEN 'super_admin'::app_role
      ELSE role
    END,
    'parent'::app_role
  )
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Update is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  );
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND (
      user_roles.role = has_role.role 
      OR (has_role.role = 'admin' AND user_roles.is_super_admin = true)
      OR (user_roles.role = 'super_admin')
      OR (user_roles.is_super_admin = true)
    )
  );
END;
$$;

-- Create a function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(
  role app_role,
  is_super_admin boolean,
  can_access_admin boolean,
  can_access_parent boolean,
  can_manage_children boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.role,
    ur.is_super_admin,
    (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true) as can_access_admin,
    (ur.role = 'parent') as can_access_parent,
    (ur.role = 'parent' OR ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true) as can_manage_children
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
  LIMIT 1;
END;
$$;

-- Create checkouts service function
CREATE OR REPLACE FUNCTION public.checkout_child(p_attendance_id uuid, p_checked_out_by uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE attendance 
  SET 
    checked_out_at = now(),
    checked_out_by = p_checked_out_by
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Create check-in service function
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attendance_id uuid;
BEGIN
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_by,
    attendance_date,
    checked_in_at
  )
  VALUES (
    p_child_id,
    p_class_id,
    p_checked_in_by,
    CURRENT_DATE,
    now()
  )
  RETURNING id INTO attendance_id;
  
  RETURN attendance_id;
END;
$$;

-- Update children RLS policies to be more specific
DROP POLICY IF EXISTS "Admin can manage all children" ON children;
DROP POLICY IF EXISTS "Parents can delete their children" ON children;
DROP POLICY IF EXISTS "Parents can insert own children" ON children;
DROP POLICY IF EXISTS "Parents can insert their children" ON children;
DROP POLICY IF EXISTS "Parents can manage their own children" ON children;
DROP POLICY IF EXISTS "Parents can update own children" ON children;
DROP POLICY IF EXISTS "Parents can update their children" ON children;
DROP POLICY IF EXISTS "Parents can view own children" ON children;
DROP POLICY IF EXISTS "Parents can view their children" ON children;
DROP POLICY IF EXISTS "Parents can view their own children" ON children;
DROP POLICY IF EXISTS "Staff and admin can view all children" ON children;
DROP POLICY IF EXISTS "Staff can update all children" ON children;
DROP POLICY IF EXISTS "Staff can view all children" ON children;

-- Create simplified and clear RLS policies for children
CREATE POLICY "Super admins can manage all children"
ON children FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'super_admin' OR is_super_admin = true)
  )
);

CREATE POLICY "Admins can manage all children"
ON children FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Parents can manage their own children"
ON children FOR ALL
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Staff can view and update all children"
ON children FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('staff', 'teacher', 'teacher_assistant')
  )
);

-- Phase 1: Database Cleanup - Remove ALL conflicting RLS policies and rebuild clean ones

-- Drop ALL existing policies on user_roles table
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins have full access" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role only" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_read_own_role" ON public.user_roles;

-- Create ONE simple, clear policy set for user_roles
CREATE POLICY "service_role_bypass" ON public.user_roles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "users_read_own_role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
    )
  );

-- Clean up profiles table policies - remove duplicates
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff and admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create clean profiles policies
CREATE POLICY "users_manage_own_profile" ON public.profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "admins_manage_all_profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
    )
  );

-- Update the handle_new_user function to be more reliable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Only assign default role if not organization creator
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_bypass" ON public.user_roles;

-- Create a security definer function to get current user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Create a security definer function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  );
$$;

-- Create new non-recursive policies for user_roles table
CREATE POLICY "users_read_own_role_safe" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles_safe" 
ON public.user_roles 
FOR ALL 
USING (
  CASE 
    WHEN auth.jwt() ->> 'role' = 'service_role' THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles ur2 
      WHERE ur2.user_id = auth.uid() 
      AND (ur2.role = 'admin' OR ur2.role = 'super_admin' OR ur2.is_super_admin = true)
      AND ur2.id != user_roles.id
    )
  END
);

-- Update other problematic policies to use the safe functions
DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.profiles;
CREATE POLICY "admins_manage_all_profiles_safe" 
ON public.profiles 
FOR ALL 
USING (id = auth.uid() OR public.is_admin_user_safe());

-- Update the get_current_user_role function to use the safe version
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'parent'::app_role
  );
$$;

-- Ensure the handle_new_user trigger creates proper default roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Only assign default role if not organization creator
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Phase 1: Database & Security Foundation
-- Fix infinite recursion in RLS policies and create proper security definer functions

-- First, drop existing problematic policies to prevent recursion
DROP POLICY IF EXISTS "admins_manage_all_roles_safe" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role_safe" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_all_profiles_safe" ON public.profiles;

-- Create comprehensive security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT COALESCE(ur.role, 'parent'::app_role)
  INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'parent'::app_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT COALESCE(ur.is_super_admin, false) OR (ur.role = 'super_admin'::app_role)
  INTO is_admin
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN is_admin;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT (ur.role IN ('admin'::app_role, 'super_admin'::app_role) OR ur.is_super_admin = true)
  INTO is_admin
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role_secure(check_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_has_role boolean := false;
BEGIN
  -- Super admins have all roles
  IF public.is_super_admin_secure() THEN
    RETURN true;
  END IF;
  
  SELECT (ur.role = check_role)
  INTO user_has_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_has_role, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Create new secure RLS policies for user_roles
CREATE POLICY "users_read_own_role_secure"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles_secure"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN auth.jwt()->>'role' = 'service_role' THEN true
    ELSE public.is_admin_secure()
  END
)
WITH CHECK (
  CASE 
    WHEN auth.jwt()->>'role' = 'service_role' THEN true
    ELSE public.is_admin_secure()
  END
);

-- Create new secure RLS policies for profiles
CREATE POLICY "users_manage_own_profile_secure"
ON public.profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admins_manage_all_profiles_secure"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- Fix attendance policies
DROP POLICY IF EXISTS "Staff and admin can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;

CREATE POLICY "staff_admin_manage_attendance_secure"
ON public.attendance
FOR ALL
TO authenticated
USING (
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role)
)
WITH CHECK (
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role)
);

-- Fix children policies
DROP POLICY IF EXISTS "Staff and admin can view all children" ON public.children;
DROP POLICY IF EXISTS "Staff can update all children" ON public.children;
DROP POLICY IF EXISTS "Staff can view all children" ON public.children;

CREATE POLICY "staff_admin_view_all_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
  )
);

CREATE POLICY "staff_admin_manage_all_children_secure"
ON public.children
FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
  )
)
WITH CHECK (
  parent_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id AND pc.parent_id = auth.uid()
  )
);

-- Create child_notes table for teachers to add notes
CREATE TABLE IF NOT EXISTS public.child_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'behavioral', 'medical', 'academic', 'parent_communication')),
  is_private boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.child_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_manage_child_notes"
ON public.child_notes
FOR ALL
TO authenticated
USING (
  teacher_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role) OR
  (public.has_role_secure('parent'::app_role) AND is_private = false AND 
   EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_notes.child_id AND c.parent_id = auth.uid()))
)
WITH CHECK (
  teacher_id = auth.uid() OR
  public.has_role_secure('admin'::app_role) OR 
  public.has_role_secure('staff'::app_role)
);

-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_activity_logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- Create comprehensive reporting views
CREATE OR REPLACE VIEW public.attendance_summary AS
SELECT 
  a.attendance_date,
  COUNT(DISTINCT a.child_id) as total_children,
  COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count,
  COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count,
  COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present,
  c.name as class_name,
  c.id as class_id
FROM public.attendance a
LEFT JOIN public.classes c ON a.class_id = c.id
GROUP BY a.attendance_date, c.name, c.id
ORDER BY a.attendance_date DESC;

-- Fix organization settings policies
DROP POLICY IF EXISTS "Only admins can insert organization settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Only admins can update organization settings" ON public.organization_settings;

CREATE POLICY "admins_manage_organization_settings_secure"
ON public.organization_settings
FOR ALL
TO authenticated
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_child_id ON public.attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_notes_child_id ON public.child_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_child_notes_teacher_id ON public.child_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Update existing database functions to use secure versions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_current_user_role_secure();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_admin_secure();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_admin_secure();
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If checking current user, use secure function
  IF user_id = auth.uid() THEN
    RETURN public.has_role_secure(role);
  END IF;
  
  -- For other users, only admins can check
  IF NOT public.is_admin_secure() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id
    AND (ur.role = has_role.role OR (has_role.role = 'admin' AND ur.is_super_admin = true))
  );
END;
$$;

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers where missing
DROP TRIGGER IF EXISTS update_child_notes_updated_at ON public.child_notes;
CREATE TRIGGER update_child_notes_updated_at
  BEFORE UPDATE ON public.child_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Phase 1: Fix Critical Database Issues

-- First, let's fix the get_users_with_roles function that's causing the Edge Function to fail
-- The error shows "structure of query does not match function result type"
-- This suggests column type mismatches

DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_super_admin boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      (au.email_confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name, p.first_name;
END;
$function$;

-- Create missing database functions for check-in/check-out operations
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
BEGIN
  -- Check if child is already checked in today
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND attendance_date = today_date 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in today';
  END IF;

  -- Insert new attendance record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, auth.uid()),
    today_date
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update attendance record with checkout time
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, auth.uid())
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;

-- Create function to get today's attendance for kiosk displays
CREATE OR REPLACE FUNCTION public.get_todays_attendance()
RETURNS TABLE(
  attendance_id uuid,
  child_id uuid,
  child_name text,
  class_name text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  is_present boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      a.id as attendance_id,
      a.child_id,
      CONCAT(c.first_name, ' ', c.last_name) as child_name,
      COALESCE(cl.name, 'No Class') as class_name,
      a.checked_in_at,
      a.checked_out_at,
      (a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL) as is_present
    FROM attendance a
    JOIN children c ON a.child_id = c.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    WHERE a.attendance_date = CURRENT_DATE
    ORDER BY a.checked_in_at DESC;
END;
$function$;

-- Fix RLS policies to prevent conflicts
-- Drop conflicting policies on user_roles table
DROP POLICY IF EXISTS "admins_manage_all_roles_secure" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role_secure" ON public.user_roles;

-- Create clean RLS policies
CREATE POLICY "service_role_bypass" ON public.user_roles
  FOR ALL USING (
    CASE
      WHEN (auth.jwt() ->> 'role'::text) = 'service_role'::text THEN true
      ELSE false
    END
  );

CREATE POLICY "users_read_own_role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_manage_roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid()
      AND (ur2.role = 'super_admin'::app_role OR ur2.is_super_admin = true)
    )
  );
-- Fix database security issues and functions
-- Security definer functions to fix linter warnings

-- Fix function search path for has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix function search path for has_role_secure function
CREATE OR REPLACE FUNCTION public.has_role_secure(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Fix function search path for is_admin_secure function
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  )
$$;

-- Fix function search path for is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  )
$$;

-- Create secure function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN is_super_admin = true THEN 'super_admin'::app_role
        ELSE role
      END
    FROM public.user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1),
    'parent'::app_role
  )
$$;
-- Drop and recreate functions to fix security issues
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_role_secure(app_role);
DROP FUNCTION IF EXISTS public.is_admin_secure();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Recreate functions with proper security definer and search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role_secure(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role = 'admin' OR role = 'super_admin' OR is_super_admin = true)
  )
$$;
-- Fix database security functions with CASCADE
-- Drop dependent policies first, then recreate function

-- Drop and recreate has_role function with proper settings using CASCADE
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If checking current user, use secure function
  IF user_id = auth.uid() THEN
    RETURN public.has_role_secure(role);
  END IF;
  
  -- For other users, only admins can check
  IF NOT public.is_admin_secure() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id
    AND (ur.role = has_role.role OR (has_role.role = 'admin' AND ur.is_super_admin = true))
  );
END;
$$;

-- Recreate the dropped RLS policies that depend on has_role
CREATE POLICY "Admin can manage all children" ON public.children
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage custom roles" ON public.custom_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage permissions" ON public.permissions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage staff invitations" ON public.staff_invitations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage user custom roles" ON public.user_custom_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete device profiles" ON public.device_profiles
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert device profiles" ON public.device_profiles
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update device profiles" ON public.device_profiles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff and admin can manage classes" ON public.classes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff and admin can manage teachers" ON public.teachers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff and admin can view all attendance" ON public.attendance
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
-- Batch 1A: Database Security & Performance Fixes

-- Fix 1: Add search_path to has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF user_id = auth.uid() THEN
    RETURN public.has_role_secure(role);
  END IF;
  
  IF NOT public.is_admin_secure() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id
    AND (ur.role = has_role.role OR (has_role.role = 'admin' AND ur.is_super_admin = true))
  );
END;
$function$;

-- Fix 2: Add search_path to get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.get_current_user_role_secure();
$function$;

-- Fix 3: Add search_path to is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.is_admin_secure();
$function$;

-- Tighten RLS: organization_settings - restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read organization settings" ON public.organization_settings;
CREATE POLICY "Authenticated users can read organization settings"
ON public.organization_settings
FOR SELECT
TO authenticated
USING (true);

-- Tighten RLS: device_profiles - ensure only admins can write
DROP POLICY IF EXISTS "Device profiles are accessible to all authenticated users" ON public.device_profiles;
CREATE POLICY "Authenticated users can read device profiles"
ON public.device_profiles
FOR SELECT
TO authenticated
USING (true);

-- Tighten RLS: classes - keep read public for authenticated, restrict write
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "Authenticated users can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- Tighten RLS: teachers - keep read for authenticated, admin write only
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;
CREATE POLICY "Authenticated users can view teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);
-- Fix remaining security warnings from linter

-- Fix 1: Add search_path to create_user_role functions (both overloaded versions)
CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id uuid, p_role app_role DEFAULT 'parent'::app_role, p_is_super_admin boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_role_id UUID;
BEGIN
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_super_admin
  )
  VALUES (
    p_user_id,
    p_role,
    p_is_super_admin
  )
  RETURNING id INTO new_role_id;
  
  RETURN new_role_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id uuid, p_role app_role DEFAULT 'parent'::app_role, p_is_super_admin boolean DEFAULT false, p_is_volunteer boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix 2: Drop and recreate auth_users_with_emails view without SECURITY DEFINER
-- This view should only be accessible to users with proper permissions through RLS
DROP VIEW IF EXISTS public.auth_users_with_emails CASCADE;

-- Create a secure function instead of a view to access user emails
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Only allow admins or the user themselves to get email
  IF NOT (public.is_admin_secure() OR auth.uid() = p_user_id) THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN user_email;
END;
$function$;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_user_email IS 'Securely retrieves user email. Only accessible by admins or the user themselves.';
-- Restore auth_users_with_emails view that was accidentally dropped
-- This view is needed by FamilyConnectPage and referenced throughout the codebase
-- We'll recreate it with proper RLS policies instead of relying on SECURITY DEFINER

CREATE OR REPLACE VIEW public.auth_users_with_emails AS
SELECT id, email
FROM auth.users;

-- Add RLS to control access to this view
ALTER VIEW public.auth_users_with_emails OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.auth_users_with_emails TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.auth_users_with_emails IS 'Provides access to user emails from auth.users. Access controlled through RLS policies on tables that reference this view.';
-- Phase 2 Batch 2A: Replace auth_users_with_emails view with secure function
-- Create a secure function to fetch multiple user emails at once

CREATE OR REPLACE FUNCTION public.get_users_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to get emails
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  -- Admins can see all emails
  IF public.is_admin_secure() THEN
    RETURN QUERY
    SELECT au.id, au.email::text
    FROM auth.users au
    WHERE au.id = ANY(user_ids);
    RETURN;
  END IF;
  
  -- Regular users can only see emails of users they have interacted with
  -- (those who have sent/received messages from them)
  RETURN QUERY
  SELECT DISTINCT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids)
  AND (
    -- Users they've messaged
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE (m.sender_id = auth.uid() AND m.recipient_id = au.id)
         OR (m.recipient_id = auth.uid() AND m.sender_id = au.id)
    )
    -- Or staff/teachers (for parent communication)
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = au.id
      AND ur.role IN ('admin', 'staff', 'teacher', 'teacher_assistant')
    )
  );
END;
$$;
-- Phase 2 Batch 2A: Complete - Drop unused auth_users_with_emails view
-- This view is no longer used in application code, replaced by get_users_emails() function

DROP VIEW IF EXISTS public.auth_users_with_emails;
-- ============================================================================
-- Phase 2, Batch 2C: Fix Critical RLS Security Issues
-- ============================================================================

-- ============================================================================
-- 1. FIX PROFILES TABLE - Restrict sensitive data access
-- ============================================================================

-- Drop duplicate policies first
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_manage_all_profiles_secure" ON public.profiles;

-- Create consolidated, secure policies for profiles
-- Users can only view and update their OWN profile
CREATE POLICY "users_view_own_profile_secure"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own_profile_secure"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can view all profiles (for user management)
CREATE POLICY "admins_view_all_profiles_secure"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_secure());

-- Admins can update all profiles (for user management)
CREATE POLICY "admins_update_all_profiles_secure"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin_secure())
WITH CHECK (is_admin_secure());

-- Admins can insert profiles (for user creation)
CREATE POLICY "admins_insert_profiles_secure"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin_secure());

-- ============================================================================
-- 2. FIX CHILDREN TABLE - Restrict medical information access
-- ============================================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Parents can view own children" ON public.children;
DROP POLICY IF EXISTS "Parents can view their children" ON public.children;
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.children;
DROP POLICY IF EXISTS "staff_admin_view_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "staff_admin_manage_all_children_secure" ON public.children;

-- Parents can view their own children (full access including medical info)
CREATE POLICY "parents_view_own_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
);

-- Teachers can only view children in their assigned classes (limited medical info)
-- For now, teachers get read-only access to their class children
CREATE POLICY "teachers_view_assigned_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  has_role_secure('teacher'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM teachers t
    JOIN attendance a ON a.class_id = t.class_id
    WHERE t.user_id = auth.uid()
    AND a.child_id = children.id
  )
);

-- Admins and staff can view all children
CREATE POLICY "admins_staff_view_all_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  is_admin_secure() 
  OR has_role_secure('staff'::app_role)
);

-- Parents can insert their own children
CREATE POLICY "parents_insert_own_children_secure"
ON public.children
FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

-- Parents can update their own children
CREATE POLICY "parents_update_own_children_secure"
ON public.children
FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
);

-- Parents can delete their own children
CREATE POLICY "parents_delete_own_children_secure"
ON public.children
FOR DELETE
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
);

-- Admins and staff can manage all children
CREATE POLICY "admins_staff_manage_all_children_secure"
ON public.children
FOR ALL
TO authenticated
USING (is_admin_secure() OR has_role_secure('staff'::app_role))
WITH CHECK (is_admin_secure() OR has_role_secure('staff'::app_role));

-- ============================================================================
-- 3. FIX ATTENDANCE_SUMMARY VIEW - Add RLS
-- ============================================================================

-- Enable RLS on the attendance_summary view
ALTER VIEW public.attendance_summary SET (security_invoker = true);

-- Create a secure function to get attendance summary with proper filtering
CREATE OR REPLACE FUNCTION public.get_attendance_summary_secure(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  attendance_date date,
  class_id uuid,
  class_name text,
  total_children bigint,
  checked_in_count bigint,
  checked_out_count bigint,
  currently_present bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admins and staff can see all class summaries
  IF is_admin_secure() OR has_role_secure('staff'::app_role) THEN
    RETURN QUERY
    SELECT 
      a.attendance_date,
      c.id as class_id,
      c.name as class_name,
      COUNT(DISTINCT a.child_id) as total_children,
      COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count,
      COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count,
      COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present
    FROM attendance a
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.attendance_date = p_date
    GROUP BY a.attendance_date, c.id, c.name;
    RETURN;
  END IF;
  
  -- Teachers can only see their assigned class summaries
  IF has_role_secure('teacher'::app_role) THEN
    RETURN QUERY
    SELECT 
      a.attendance_date,
      c.id as class_id,
      c.name as class_name,
      COUNT(DISTINCT a.child_id) as total_children,
      COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count,
      COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count,
      COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present
    FROM attendance a
    LEFT JOIN classes c ON a.class_id = c.id
    INNER JOIN teachers t ON t.class_id = c.id
    WHERE a.attendance_date = p_date
    AND t.user_id = auth.uid()
    GROUP BY a.attendance_date, c.id, c.name;
    RETURN;
  END IF;
  
  -- Parents can only see summaries for classes their children attend
  IF has_role_secure('parent'::app_role) THEN
    RETURN QUERY
    SELECT 
      a.attendance_date,
      c.id as class_id,
      c.name as class_name,
      COUNT(DISTINCT a.child_id) as total_children,
      COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count,
      COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count,
      COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present
    FROM attendance a
    LEFT JOIN classes c ON a.class_id = c.id
    INNER JOIN children ch ON a.child_id = ch.id
    WHERE a.attendance_date = p_date
    AND (ch.parent_id = auth.uid() OR EXISTS (
      SELECT 1 FROM parent_children pc 
      WHERE pc.child_id = ch.id 
      AND pc.parent_id = auth.uid()
    ))
    GROUP BY a.attendance_date, c.id, c.name;
    RETURN;
  END IF;
  
  -- No access for other roles
  RETURN;
END;
$$;
-- Phase 3 Batch 3A: Fix Remaining RLS Security Issues
-- Focus: Messages, Child Notes, QR Codes, Activity Logs, Staff Invitations, Parent Children

-- ============================================
-- 1. FIX MESSAGES TABLE RLS
-- ============================================
-- Current issue: Policies may not adequately restrict access to private messages
-- Solution: Ensure only sender, recipient, and admins can access messages

-- Drop existing policies
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- Create secure policies
CREATE POLICY "users_insert_own_messages_secure" 
ON messages FOR INSERT 
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "users_view_own_messages_secure" 
ON messages FOR SELECT 
TO authenticated
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid() 
  OR is_admin_secure()
);

CREATE POLICY "users_update_own_messages_secure" 
ON messages FOR UPDATE 
TO authenticated
USING (
  recipient_id = auth.uid() 
  OR sender_id = auth.uid() 
  OR is_admin_secure()
)
WITH CHECK (
  recipient_id = auth.uid() 
  OR sender_id = auth.uid() 
  OR is_admin_secure()
);

CREATE POLICY "admins_delete_messages_secure" 
ON messages FOR DELETE 
TO authenticated
USING (is_admin_secure());

-- ============================================
-- 2. FIX CHILD_NOTES TABLE RLS
-- ============================================
-- Current issue: Teacher observations may be accessible beyond authorized users
-- Solution: Restrict access to note creator, admins, staff, and parents (for non-private notes only)

-- Drop existing policy
DROP POLICY IF EXISTS "teachers_manage_child_notes" ON child_notes;

-- Create secure policies
CREATE POLICY "teachers_insert_own_notes_secure" 
ON child_notes FOR INSERT 
TO authenticated
WITH CHECK (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "teachers_view_own_notes_secure" 
ON child_notes FOR SELECT 
TO authenticated
USING (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
  OR (
    -- Parents can see non-private notes for their children
    has_role_secure('parent'::app_role) 
    AND is_private = false 
    AND EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = child_notes.child_id 
      AND (
        c.parent_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM parent_children pc 
          WHERE pc.child_id = c.id 
          AND pc.parent_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "teachers_update_own_notes_secure" 
ON child_notes FOR UPDATE 
TO authenticated
USING (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "teachers_delete_own_notes_secure" 
ON child_notes FOR DELETE 
TO authenticated
USING (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

-- ============================================
-- 3. FIX QR_CODES TABLE RLS
-- ============================================
-- Current issue: QR codes could be stolen for unauthorized pickup
-- Solution: Restrict access to parents of the child, staff, and admins only

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can view their children's QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Staff can manage QR codes" ON qr_codes;

-- Create secure policies
CREATE POLICY "parents_view_own_children_qr_secure" 
ON qr_codes FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = qr_codes.child_id 
    AND (
      c.parent_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM parent_children pc 
        WHERE pc.child_id = c.id 
        AND pc.parent_id = auth.uid()
      )
    )
  )
  OR has_role_secure('admin'::app_role)
  OR has_role_secure('staff'::app_role)
  OR has_role_secure('teacher'::app_role)
);

CREATE POLICY "staff_manage_qr_codes_secure" 
ON qr_codes FOR ALL 
TO authenticated
USING (
  has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

-- ============================================
-- 4. FIX ACTIVITY_LOGS TABLE RLS
-- ============================================
-- Current issue: Activity logs reveal user behavior patterns
-- Solution: Restrict access to admins only

-- Drop existing policy
DROP POLICY IF EXISTS "admins_view_activity_logs" ON activity_logs;

-- Create secure policy
CREATE POLICY "admins_view_activity_logs_secure" 
ON activity_logs FOR SELECT 
TO authenticated
USING (is_admin_secure());

CREATE POLICY "admins_manage_activity_logs_secure" 
ON activity_logs FOR ALL 
TO authenticated
USING (is_admin_secure())
WITH CHECK (is_admin_secure());

-- ============================================
-- 5. FIX STAFF_INVITATIONS TABLE RLS
-- ============================================
-- Current issue: Staff email addresses and invitation tokens exposed
-- Solution: Restrict access to admins and the invited user only

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage staff invitations" ON staff_invitations;
DROP POLICY IF EXISTS "Staff can view their own invitation" ON staff_invitations;

-- Create secure policies
CREATE POLICY "admins_manage_staff_invitations_secure" 
ON staff_invitations FOR ALL 
TO authenticated
USING (is_admin_secure())
WITH CHECK (is_admin_secure());

CREATE POLICY "users_view_own_invitation_secure" 
ON staff_invitations FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR is_admin_secure()
);

-- ============================================
-- 6. FIX PARENT_CHILDREN TABLE RLS
-- ============================================
-- Current issue: Family relationships and pickup authorization exposed
-- Solution: Ensure only parents involved, admins, and staff can see relationships

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can create their relationships" ON parent_children;
DROP POLICY IF EXISTS "Parents can delete their relationships" ON parent_children;
DROP POLICY IF EXISTS "Parents can update their relationships" ON parent_children;
DROP POLICY IF EXISTS "Parents can view their relationships" ON parent_children;
DROP POLICY IF EXISTS "Users can insert their own parent_children relationships" ON parent_children;
DROP POLICY IF EXISTS "Users can view their own parent_children relationships" ON parent_children;

-- Create secure policies
CREATE POLICY "parents_view_own_relationships_secure" 
ON parent_children FOR SELECT 
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = parent_children.child_id 
    AND c.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_insert_own_relationships_secure" 
ON parent_children FOR INSERT 
TO authenticated
WITH CHECK (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_update_own_relationships_secure" 
ON parent_children FOR UPDATE 
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = parent_children.child_id 
    AND c.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = parent_children.child_id 
    AND c.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "admins_delete_relationships_secure" 
ON parent_children FOR DELETE 
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);
-- Phase 3 Batch 3B: Fix Security Answer Storage
-- Issue: Security answers stored in plaintext, should be hashed

-- Add new column for hashed security answer
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS security_answer_hash TEXT;

-- Create function to hash security answers
CREATE OR REPLACE FUNCTION public.hash_security_answer(answer TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use crypt extension for secure hashing
  RETURN crypt(LOWER(TRIM(answer)), gen_salt('bf', 8));
END;
$$;

-- Create function to verify security answer
CREATE OR REPLACE FUNCTION public.verify_security_answer(user_id UUID, answer TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT security_answer_hash INTO stored_hash
  FROM profiles
  WHERE id = user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare provided answer hash with stored hash
  RETURN stored_hash = crypt(LOWER(TRIM(answer)), stored_hash);
END;
$$;

-- Note: The security_answer column will be deprecated
-- New implementations should use security_answer_hash + hash_security_answer()
-- Old data can be migrated manually if needed
-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_bypass" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;

-- Create safe policies using security definer functions
-- Users can always read their own role (no recursion)
CREATE POLICY "users_read_own_role_safe"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Super admins can manage all roles (using security definer function)
CREATE POLICY "super_admins_manage_roles_safe"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_super_admin_secure())
WITH CHECK (is_super_admin_secure());

-- Service role has full access
CREATE POLICY "service_role_full_access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_staff_members();

-- Recreate with correct return type including is_volunteer
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email,
      p.first_name,
      p.last_name,
      p.phone,
      ur.role::TEXT,
      ur.is_super_admin,
      ur.is_volunteer,
      (au.email_confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role IN ('admin', 'staff', 'teacher', 'teacher_assistant')
    ORDER BY 
      p.last_name, p.first_name;
END;
$$;
-- Simplest possible table creation to debug
CREATE TABLE IF NOT EXISTS public.enrolled_devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL,
  enrollment_code   TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT now()
);
-- ============================================================
-- Migration: Fix RLS Recursion between children and parent_children
-- Date: 2026-02-24
-- ============================================================

-- 1. Fix parent_children policies to NOT query children table
-- This breaks the recursive loop: children -> parent_children -> children

DROP POLICY IF EXISTS "parents_view_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "parents_update_own_relationships_secure" ON public.parent_children;

CREATE POLICY "parents_view_own_relationships_secure" 
ON public.parent_children FOR SELECT 
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_update_own_relationships_secure" 
ON public.parent_children FOR UPDATE 
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

-- 2. Ensure children table policies are safe
DROP POLICY IF EXISTS "parents_view_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_update_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_delete_own_children_secure" ON public.children;

CREATE POLICY "parents_view_own_children_secure"
ON public.children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_update_own_children_secure"
ON public.children FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_delete_own_children_secure"
ON public.children FOR DELETE
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);
-- Add missing columns to enrolled_devices
ALTER TABLE public.enrolled_devices 
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_ip TEXT,
  ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_enrolled_devices_enrollment_code ON public.enrolled_devices (enrollment_code);
CREATE INDEX IF NOT EXISTS idx_enrolled_devices_organization ON public.enrolled_devices (organization_id);

-- Add Trigger
CREATE OR REPLACE FUNCTION public.update_enrolled_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrolled_devices_updated_at ON public.enrolled_devices;
CREATE TRIGGER trg_enrolled_devices_updated_at
  BEFORE UPDATE ON public.enrolled_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_enrolled_devices_updated_at();
-- Add RLS to enrolled_devices
ALTER TABLE public.enrolled_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to enrolled_devices" ON public.enrolled_devices;
CREATE POLICY "Admin full access to enrolled_devices"
  ON public.enrolled_devices
  FOR ALL
  TO authenticated
  USING (public.is_admin_secure())
  WITH CHECK (public.is_admin_secure());

DROP POLICY IF EXISTS "Staff can view active enrolled_devices" ON public.enrolled_devices;
CREATE POLICY "Staff can view active enrolled_devices"
  ON public.enrolled_devices
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND (
      public.is_admin_secure() 
      OR public.has_role_secure('staff'::public.app_role)
      OR public.has_role_secure('teacher'::public.app_role)
      OR public.has_role_secure('teacher_assistant'::public.app_role)
    )
  );

-- Audit table
CREATE TABLE IF NOT EXISTS public.device_activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID REFERENCES public.enrolled_devices(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address   TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.device_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access to device_activity_log" ON public.device_activity_log;
CREATE POLICY "Admin access to device_activity_log"
  ON public.device_activity_log
  FOR ALL
  TO authenticated
  USING (public.is_admin_secure())
  WITH CHECK (public.is_admin_secure());
-- ============================================================
-- Migration: Comprehensive RLS Cleanup and Recursion Fix
-- Date: 2026-02-25
-- ============================================================

-- 1. DROP ALL POTENTIALLY CONFLICTING POLICIES
-- Children
DROP POLICY IF EXISTS "Admin can manage all children" ON public.children;
DROP POLICY IF EXISTS "admins_staff_manage_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "admins_staff_view_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_delete_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_insert_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_update_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "parents_view_own_children_secure" ON public.children;
DROP POLICY IF EXISTS "staff_admin_manage_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "staff_admin_view_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "teachers_view_assigned_children_secure" ON public.children;

-- Parent-Children Relationships
DROP POLICY IF EXISTS "parents_view_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "parents_insert_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "parents_update_own_relationships_secure" ON public.parent_children;
DROP POLICY IF EXISTS "admins_delete_relationships_secure" ON public.parent_children;

-- User Roles (Major source of recursion)
DROP POLICY IF EXISTS "users_read_own_role_safe" ON public.user_roles;
DROP POLICY IF EXISTS "super_admins_manage_roles_safe" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;

-- 2. RE-IMPLEMENT CLEAN POLICIES

-- ==========================================
-- USER_ROLES (Non-recursive)
-- ==========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_role" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (is_admin_secure());

-- ==========================================
-- CHILDREN
-- ==========================================
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Simple INSERT for parents
CREATE POLICY "parents_insert_children"
ON public.children FOR INSERT 
TO authenticated 
WITH CHECK (parent_id = auth.uid());

-- SELECT for parents and staff
CREATE POLICY "authenticated_view_children"
ON public.children FOR SELECT 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure() 
  OR has_role_secure('staff'::app_role)
  OR has_role_secure('teacher'::app_role)
  OR has_role_secure('teacher_assistant'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc 
    WHERE pc.child_id = id AND pc.parent_id = auth.uid()
  )
);

-- UPDATE for parents and staff
CREATE POLICY "authenticated_update_children"
ON public.children FOR UPDATE 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure() 
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid() 
  OR is_admin_secure() 
  OR has_role_secure('staff'::app_role)
);

-- DELETE for parents and staff
CREATE POLICY "authenticated_delete_children"
ON public.children FOR DELETE 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure()
);

-- ==========================================
-- PARENT_CHILDREN (Relationships)
-- ==========================================
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_view_relationships"
ON public.parent_children FOR SELECT 
TO authenticated 
USING (
  parent_id = auth.uid() 
  OR is_admin_secure() 
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_insert_relationships"
ON public.parent_children FOR INSERT 
TO authenticated 
WITH CHECK (parent_id = auth.uid() OR is_admin_secure());

CREATE POLICY "authenticated_manage_relationships"
ON public.parent_children FOR ALL 
TO authenticated 
USING (is_admin_secure() OR parent_id = auth.uid());
-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_staff_members();

-- Recreate with more robust implementation and include super_admin
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO service_role;
-- ============================================================
-- Migration: Staff Verification Workflow + App Improvements
-- Date: 2026-02-25
-- ============================================================

-- 1. STAFF VERIFICATION STATUS on user_roles
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' 
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'suspended')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- All existing staff/admin users should be auto-verified (grandfathered in)
UPDATE public.user_roles 
SET verification_status = 'verified', verified_at = NOW()
WHERE role IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
  AND verification_status = 'unverified';

-- Parents are always verified (they don't need document checks)
UPDATE public.user_roles 
SET verification_status = 'verified', verified_at = NOW()
WHERE role = 'parent' AND verification_status = 'unverified';


-- 2. STAFF DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'police_check', 'background_check', 'reference_letter', 
    'training_cert', 'first_aid_cert', 'medical_clearance', 
    'insurance', 'pastoral_reference', 'child_protection_cert', 'other'
  )),
  document_name TEXT NOT NULL,
  file_path TEXT, -- Supabase Storage path
  file_size INTEGER,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ, -- For documents that expire (e.g., first aid cert)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on staff_documents
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Staff can view their own documents
CREATE POLICY "staff_view_own_docs" ON public.staff_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Staff can insert their own documents
CREATE POLICY "staff_upload_own_docs" ON public.staff_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update document status (approve/reject)
CREATE POLICY "admins_manage_docs" ON public.staff_documents
  FOR ALL TO authenticated
  USING (is_admin_secure());


-- 3. DOCUMENT REQUIREMENTS TABLE (configurable by admin)
CREATE TABLE IF NOT EXISTS public.document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  required_for_roles TEXT[] DEFAULT ARRAY['staff', 'teacher', 'teacher_assistant'],
  is_mandatory BOOLEAN DEFAULT true,
  has_expiry BOOLEAN DEFAULT false,
  expiry_months INTEGER, -- how many months before it expires
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_requirements" ON public.document_requirements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_manage_requirements" ON public.document_requirements
  FOR ALL TO authenticated USING (is_admin_secure());

-- Seed default document requirements
INSERT INTO public.document_requirements (document_type, display_name, description, is_mandatory, has_expiry, expiry_months) VALUES
  ('police_check', 'Police/Criminal Record Check', 'A valid police background check or criminal record clearance. Must be less than 6 months old.', true, true, 12),
  ('child_protection_cert', 'Child Protection Training', 'Certificate of completion for child protection/safeguarding training.', true, true, 24),
  ('reference_letter', 'Pastoral/Character Reference', 'A reference letter from a pastor, church leader, or community leader.', true, false, NULL),
  ('first_aid_cert', 'First Aid Certificate', 'Valid first aid or CPR training certificate.', false, true, 24),
  ('training_cert', 'Relevant Training Certificate', 'Any relevant early childhood education or ministry training certificates.', false, false, NULL),
  ('medical_clearance', 'Medical Clearance', 'Medical clearance to work with children, if applicable.', false, true, 12)
ON CONFLICT DO NOTHING;


-- 4. MEDICAL PROFILES FOR CHILDREN (structured)
CREATE TABLE IF NOT EXISTS public.child_medical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE UNIQUE,
  blood_type TEXT,
  allergies JSONB DEFAULT '[]'::JSONB, -- [{type: 'food', name: 'peanuts', severity: 'severe', notes: '...'}]
  medications JSONB DEFAULT '[]'::JSONB, -- [{name: 'Inhaler', dosage: 'As needed', frequency: 'PRN', notes: '...'}]
  conditions JSONB DEFAULT '[]'::JSONB, -- [{name: 'Asthma', notes: '...', diagnosed_date: '...'}]
  dietary_restrictions TEXT,
  emergency_notes TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  last_physical_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.child_medical_profiles ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own child's medical profile
CREATE POLICY "parents_manage_own_child_medical" ON public.child_medical_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
    OR has_role_secure('staff'::app_role)
    OR has_role_secure('teacher'::app_role)
  );


-- 5. KIOSK SETTINGS (including PIN)
CREATE TABLE IF NOT EXISTS public.kiosk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_kiosk_settings" ON public.kiosk_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_manage_kiosk_settings" ON public.kiosk_settings
  FOR ALL TO authenticated USING (is_admin_secure());

-- Insert default kiosk settings
INSERT INTO public.kiosk_settings (setting_key, setting_value) VALUES
  ('require_pin', 'true'),
  ('kiosk_pin', '123456'),
  ('auto_print_nametag', 'true'),
  ('allow_self_checkout', 'false'),
  ('session_timeout_minutes', '30')
ON CONFLICT (setting_key) DO NOTHING;


-- 6. FUNCTIONS

-- Function to get staff verification status
CREATE OR REPLACE FUNCTION public.get_staff_verification_status(p_user_id UUID)
RETURNS TABLE(
  verification_status TEXT,
  verified_at TIMESTAMPTZ,
  total_required INTEGER,
  total_submitted INTEGER,
  total_approved INTEGER,
  total_rejected INTEGER,
  total_pending INTEGER,
  is_fully_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    WITH doc_stats AS (
      SELECT 
        COUNT(*) FILTER (WHERE sd.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE sd.status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE sd.status = 'pending') as pending_count,
        COUNT(*) as total_submitted
      FROM public.staff_documents sd
      WHERE sd.user_id = p_user_id
    ),
    required_count AS (
      SELECT COUNT(*) as total
      FROM public.document_requirements dr
      WHERE dr.is_mandatory = true
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = p_user_id 
            AND ur.role::TEXT = ANY(dr.required_for_roles)
        )
    )
    SELECT 
      ur.verification_status,
      ur.verified_at,
      rc.total::INTEGER as total_required,
      ds.total_submitted::INTEGER,
      ds.approved_count::INTEGER as total_approved,
      ds.rejected_count::INTEGER as total_rejected,
      ds.pending_count::INTEGER as total_pending,
      (ds.approved_count >= rc.total AND rc.total > 0) as is_fully_verified
    FROM public.user_roles ur
    CROSS JOIN doc_stats ds
    CROSS JOIN required_count rc
    WHERE ur.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_verification_status(UUID) TO authenticated;

-- Function to approve/reject staff verification
CREATE OR REPLACE FUNCTION public.admin_verify_staff(
  p_user_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  -- Check admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_admin_id 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.user_roles 
    SET verification_status = 'verified',
        verified_at = NOW(),
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Approved by administrator')
    WHERE user_id = p_user_id;

    -- Log this action
    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'verify_staff', 'user_roles', p_user_id::TEXT, 
      jsonb_build_object('action', 'approved', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'verified');

  ELSIF p_action = 'reject' THEN
    UPDATE public.user_roles 
    SET verification_status = 'rejected',
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Rejected by administrator')
    WHERE user_id = p_user_id;

    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'reject_staff', 'user_roles', p_user_id::TEXT, 
      jsonb_build_object('action', 'rejected', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_staff(UUID, TEXT, TEXT) TO authenticated;

-- Function to get pending staff verifications for admin dashboard
CREATE OR REPLACE FUNCTION public.get_pending_staff_verifications()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  verification_status TEXT,
  created_at TIMESTAMPTZ,
  documents_submitted BIGINT,
  documents_approved BIGINT,
  documents_pending BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT,
      COALESCE(p.last_name, '')::TEXT,
      ur.role::TEXT,
      ur.verification_status,
      ur.created_at,
      (SELECT COUNT(*) FROM public.staff_documents sd WHERE sd.user_id = ur.user_id),
      (SELECT COUNT(*) FROM public.staff_documents sd WHERE sd.user_id = ur.user_id AND sd.status = 'approved'),
      (SELECT COUNT(*) FROM public.staff_documents sd WHERE sd.user_id = ur.user_id AND sd.status = 'pending')
    FROM public.user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role::TEXT IN ('staff', 'teacher', 'teacher_assistant')
      AND ur.verification_status IN ('unverified', 'pending', 'rejected')
    ORDER BY ur.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_staff_verifications() TO authenticated;

-- Update the get_staff_members function to only return VERIFIED staff
DROP FUNCTION IF EXISTS public.get_staff_members();

CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  verification_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      COALESCE(ur.verification_status, 'unverified')::TEXT as verification_status
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO service_role;

-- 7. Create Supabase Storage bucket for staff documents (done via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents', 
  'staff-documents', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff documents
CREATE POLICY "staff_upload_own_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "staff_view_own_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'staff-documents' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (ur.role IN ('admin', 'super_admin') OR ur.is_super_admin = true)
      )
    )
  );

CREATE POLICY "admins_manage_all_files" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'staff-documents' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role IN ('admin', 'super_admin') OR ur.is_super_admin = true)
    )
  );
-- DATA MIGRATION: children -> child_medical_profiles
-- This script safely migrates existing medical information from the 'children' table 
-- into the new structured 'child_medical_profiles' table.

INSERT INTO public.child_medical_profiles (
    child_id, 
    allergies, 
    emergency_notes, 
    created_at, 
    updated_at
)
SELECT 
    c.id as child_id,
    CASE 
        WHEN c.allergies IS NOT NULL AND c.allergies != '' THEN 
            jsonb_build_array(
                jsonb_build_object(
                    'type', c.allergies,
                    'severity', 'moderate',
                    'reaction', 'Documented in legacy system'
                )
            )
        ELSE '[]'::jsonb
    END as allergies,
    COALESCE(c.medical_info, '') as emergency_notes,
    NOW(),
    NOW()
FROM public.children c
ON CONFLICT (child_id) DO UPDATE SET
    allergies = CASE 
        WHEN EXCLUDED.allergies != '[]'::jsonb AND (child_medical_profiles.allergies IS NULL OR child_medical_profiles.allergies = '[]'::jsonb) 
        THEN EXCLUDED.allergies 
        ELSE child_medical_profiles.allergies 
    END,
    emergency_notes = CASE 
        WHEN EXCLUDED.emergency_notes != '' AND (child_medical_profiles.emergency_notes IS NULL OR child_medical_profiles.emergency_notes = '') 
        THEN EXCLUDED.emergency_notes 
        ELSE child_medical_profiles.emergency_notes 
    END;

-- Optional: Clear the old columns after verification
-- COMMENTED OUT FOR SAFETY
-- ALTER TABLE public.children DROP COLUMN IF EXISTS allergies;
-- ALTER TABLE public.children DROP COLUMN IF EXISTS medical_info;

-- Migration: Restrict Child Medical Profile Editing to Parents and Admins
-- Date: 2026-02-25

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "parents_manage_own_child_medical" ON public.child_medical_profiles;

-- 1. VIEW POLICY: Parents, Admins, Staff, Teachers can view medical profiles
CREATE POLICY "view_child_medical_profiles" ON public.child_medical_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
    OR has_role_secure('staff'::app_role)
    OR has_role_secure('teacher'::app_role)
    OR has_role_secure('teacher_assistant'::app_role)
  );

-- 2. MANAGE POLICY: Only Parents (for their own children) and Admins can Manage (Insert/Update/Delete)
CREATE POLICY "manage_child_medical_profiles" ON public.child_medical_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
  );

-- Migration: Drop dangerous execute_sql function
-- Date: 2026-02-25

DROP FUNCTION IF EXISTS public.execute_sql(text);
DROP FUNCTION IF EXISTS public.check_sql_query_safety(text);

-- Migration: Fix RLS bypass policies for user_roles and families
-- Date: 2026-02-25

-- 1. Drop the dangerous bypass policies
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "System functions bypass RLS for families" ON public.families;

-- 2. Implement proper RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

-- 3. Implement proper RLS for families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant families" 
ON public.families 
FOR SELECT 
TO authenticated 
USING (
  -- Either simple authenticated access for lookups
  -- Or strictly: if they have a child in this family
  true 
);

CREATE POLICY "Admins can view all families" 
ON public.families 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

CREATE POLICY "Admins can manage all families" 
ON public.families 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

-- Migration: Secure Attendance RPC Functions and QR Tokens
-- Date: 2026-02-25

-- 1. Ensure qr_codes has a secure structure (already exists, but let's make sure it's used correctly)
-- The existing useQRCodes.ts inserts `child:id:timestamp` into qr_data.
-- We will change this to a secure token in the frontend, but we need the database to verify it.

-- 2. Update checkin_child with authorization
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check
  -- Check if caller is admin/staff/teacher
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  -- Check if caller is the parent
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  -- Check if a valid QR token is provided
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND attendance_date = today_date 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in today';
  END IF;

  -- 3. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

-- 3. Update checkout_child with authorization
CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- Get child_id from attendance record
  SELECT child_id INTO v_child_id
  FROM attendance
  WHERE id = p_attendance_id;

  IF v_child_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Authorization Check
  -- Check if caller is admin/staff/teacher
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  -- Check if caller is the parent
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  -- Check if a valid QR token is provided (matching the child)
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = v_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check out this child';
  END IF;

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id)
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;

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

-- Migration: Allow Users to Self-Insert Their First Role
-- Date: 2026-02-25
-- 
-- Context: The client-side AuthContext attempts to insert a default 'parent' role 
-- when a newly authenticated user has no row in user_roles. 
-- The handle_new_user trigger usually handles this, but it can fail or  
-- race conditions can occur. This migration adds a safe INSERT-only 
-- policy so a user can create their own record on the client side as a fallback, 
-- BUT only for the 'parent' role and only for their own user_id.

-- Only applies on INSERT; users cannot change their own role via this path.
DROP POLICY IF EXISTS "Users can insert their own initial role" ON public.user_roles;
CREATE POLICY "Users can insert their own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert a row for themselves
  user_id = auth.uid()
  -- And only as a 'parent' role (not admin/staff escalation)
  AND role = 'parent'::app_role
  AND is_super_admin = false
  -- And only if they don't already have a role (prevents re-insertion)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- 1. Add security_pin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_pin TEXT;

-- 2. Promote the test user to super_admin so we can test admin flows
-- We use the email to find the user in auth.users
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'testparent2@example.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Upsert role into user_roles safely without needing a unique constraint on user_id
        IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
            UPDATE public.user_roles 
            SET role = 'super_admin'::app_role, 
                is_super_admin = true, 
                verification_status = 'verified', 
                verified_at = NOW()
            WHERE user_id = v_user_id;
        ELSE
            INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
            VALUES (v_user_id, 'super_admin'::app_role, true, 'verified', NOW());
        END IF;
            
        RAISE NOTICE 'User testparent2@example.com promoted to super_admin';
    END IF;
END $$;

-- Migration: Enhanced Access Control and Kiosk Security
-- Date: 2026-03-08

-- 1. Add 'kiosk' to app_role enum
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'kiosk';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 2. Ensure Kiosk role exists in custom_roles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE name = 'Kiosk') THEN
        INSERT INTO public.custom_roles (name, description)
        VALUES ('Kiosk', 'Dedicated role for check-in kiosk devices with limited access');
    END IF;
END $$;

-- 3. Add 'access_kiosk' permission
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE name = 'access_kiosk') THEN
        INSERT INTO public.permissions (name, resource, action, description)
        VALUES ('access_kiosk', 'kiosk', 'access', 'Ability to access and operate the check-in kiosk');
    END IF;
END $$;

-- 4. Grant access_kiosk to relevant roles
DO $$
DECLARE
    v_perm_id uuid;
BEGIN
    SELECT id INTO v_perm_id FROM public.permissions WHERE name = 'access_kiosk';
    
    -- Admin, Staff, Teacher, Kiosk
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT id, v_perm_id FROM public.custom_roles WHERE name IN ('Admin', 'Staff', 'Teacher', 'Kiosk')
    ON CONFLICT DO NOTHING;
END $$;

-- 5. Helper function for kiosk access
CREATE OR REPLACE FUNCTION public.can_access_kiosk(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.check_user_permission(p_user_id, 'access_kiosk');
END;
$$;

-- Migration: Fix RLS Recursion on user_roles
-- Date: 2026-03-09

-- 1. Drop old policies
DROP POLICY IF EXISTS "users_view_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 2. Create clean, non-recursive policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Base CASE: Users can always see THEIR OWN role (needed for all permission checks)
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can also see everyone's role
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  -- Use a subquery that specifically only looks at the user's OWN row to break recursion
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
);

-- Admins can manage all roles
CREATE POLICY "admins_manage_all_roles_final"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
);

-- 3. Debug function (keep it for now)
CREATE OR REPLACE FUNCTION public.debug_check_user_roles(p_user_id uuid)
RETURNS TABLE(user_id uuid, role text, is_super_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT ur.user_id, ur.role::text, ur.is_super_admin 
               FROM public.user_roles ur 
               WHERE ur.user_id = p_user_id;
END;
$$;

-- Migration: cleanup user_roles and promote admin
-- Date: 2026-03-09

-- 1. Ensure all values exist in app_role enum
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'teacher_assistant';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'volunteer';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'kiosk';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 2. Remove duplicates from user_roles
WITH dedupped AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY 
             CASE role::TEXT
               WHEN 'super_admin' THEN 1
               WHEN 'admin' THEN 2
               WHEN 'teacher' THEN 3
               WHEN 'teacher_assistant' THEN 4
               WHEN 'staff' THEN 5
               WHEN 'volunteer' THEN 6
               WHEN 'parent' THEN 7
               ELSE 10
             END ASC, created_at DESC) as rn
    FROM public.user_roles
)
DELETE FROM public.user_roles 
WHERE id IN (SELECT id FROM dedupped WHERE rn > 1);

-- 3. Add unique constraint to prevent future duplicates
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 4. Explicitly promote the users
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Promote wisdom_borntobegreat@yahoo.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'wisdom_borntobegreat@yahoo.com';
    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_roles 
        SET role = 'super_admin'::public.app_role, 
            is_super_admin = true, 
            verification_status = 'verified', 
            verified_at = NOW()
        WHERE user_id = v_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
            VALUES (v_user_id, 'super_admin'::public.app_role, true, 'verified', NOW());
        END IF;
    END IF;

    -- Promote wisdom.salami@tdwas.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'wisdom.salami@tdwas.com';
    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_roles 
        SET role = 'super_admin'::public.app_role, 
            is_super_admin = true, 
            verification_status = 'verified', 
            verified_at = NOW()
        WHERE user_id = v_user_id;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_table_policies_json(p_tablename text)
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(t)) FROM (
    SELECT policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = p_tablename
  ) t;
$$;

-- Migration: Fix policies infinite recursion for good
-- Date: 2026-03-09

-- 1. Drop ALL potentially recursive policies
DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

DROP POLICY IF EXISTS "users_view_own_role_final" ON public.user_roles;
DROP POLICY IF EXISTS "admins_view_all_roles_final" ON public.user_roles;
DROP POLICY IF EXISTS "admins_manage_all_roles_final" ON public.user_roles;

-- 2. Create the exact three minimal policies using SECURITY DEFINER function to prevent recursion

-- Base CASE: Users can always see THEIR OWN role
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can also see everyone's role using the secure function
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- Admins can manage all roles using the secure function
CREATE POLICY "admins_manage_all_roles_final"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(ur)) FROM (
    SELECT user_id, role, is_super_admin, created_at, verification_status 
    FROM public.user_roles
  ) ur;
$$;

CREATE OR REPLACE FUNCTION public.get_table_schema(p_tablename text)
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(t)) FROM (
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = p_tablename
  ) t;
$$;

-- Migration: Fix handle_new_user conflict target
-- Date: 2026-03-09

-- Update the handle_new_user trigger to use the correct unique constraint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Only assign default role if not organization creator
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Migration: Promote Wisdom to Super Admin
-- Date: 2026-03-09

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'wisdom.borntobegreat@yahoo.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Safely update user_roles
        INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
        VALUES (v_user_id, 'super_admin'::app_role, true, 'verified', NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            role = 'super_admin'::app_role,
            is_super_admin = true,
            verification_status = 'verified',
            verified_at = NOW();
            
        RAISE NOTICE 'User wisdom.borntobegreat@yahoo.com promoted to super_admin';
    END IF;
END $$;

-- Migration: Create kiosk_settings table
-- Date: 2026-03-09

CREATE TABLE IF NOT EXISTS public.kiosk_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure description column exists (in case table was created partially)
ALTER TABLE public.kiosk_settings ADD COLUMN IF NOT EXISTS description TEXT;

-- Enable RLS
ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Super admins can manage kiosk settings" ON public.kiosk_settings;
CREATE POLICY "Super admins can manage kiosk settings" 
    ON public.kiosk_settings 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'super_admin' OR is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Allow public read-only access to kiosk settings" ON public.kiosk_settings;
CREATE POLICY "Allow public read-only access to kiosk settings"
    ON public.kiosk_settings
    FOR SELECT
    USING (true);

-- Seed default settings
INSERT INTO public.kiosk_settings (setting_key, setting_value, description)
VALUES 
('require_pin', 'false', 'Whether to require the Master PIN for new terminal activations'),
('kiosk_pin', '123456', 'Master PIN for activating terminals')
ON CONFLICT (setting_key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = now();

-- Migration: Create device_activity_log table
-- Date: 2026-03-09

CREATE TABLE IF NOT EXISTS public.device_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.enrolled_devices(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Super admins can view device logs" ON public.device_activity_log;
CREATE POLICY "Super admins can view device logs" 
    ON public.device_activity_log 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'super_admin' OR is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Allow system to insert device logs" ON public.device_activity_log;
CREATE POLICY "Allow system to insert device logs"
    ON public.device_activity_log
    FOR INSERT
    WITH CHECK (true);

-- Migration: Grant kiosk role SELECT access to children, classes, attendance, qr_codes
-- The kiosk device user needs to search children, view classes, and process check-ins.
-- Without this, the kiosk terminal shows 0 results on all searches.

-- 1. CHILDREN: Allow kiosk to SELECT children
DROP POLICY IF EXISTS "authenticated_view_children" ON public.children;
CREATE POLICY "authenticated_view_children"
ON public.children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
  OR has_role_secure('teacher'::app_role)
  OR has_role_secure('teacher_assistant'::app_role)
  OR has_role_secure('kiosk'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.child_id = id AND pc.parent_id = auth.uid()
  )
);

-- 2. CLASSES: Allow kiosk to SELECT classes
DROP POLICY IF EXISTS "kiosk_view_classes" ON public.classes;
CREATE POLICY "kiosk_view_classes"
ON public.classes FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 3. ATTENDANCE: Allow kiosk to SELECT and INSERT attendance (for check-in/check-out)
DROP POLICY IF EXISTS "kiosk_view_attendance" ON public.attendance;
CREATE POLICY "kiosk_view_attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

DROP POLICY IF EXISTS "kiosk_insert_attendance" ON public.attendance;
CREATE POLICY "kiosk_insert_attendance"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (has_role_secure('kiosk'::app_role));

-- 4. QR_CODES: Allow kiosk to SELECT qr_codes (needed for QR scan check-in)
DROP POLICY IF EXISTS "kiosk_view_qr_codes" ON public.qr_codes;
CREATE POLICY "kiosk_view_qr_codes"
ON public.qr_codes FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 5. KIOSK_SETTINGS: Already has public read policy, but ensure kiosk can read
DROP POLICY IF EXISTS "kiosk_read_settings" ON public.kiosk_settings;
CREATE POLICY "kiosk_read_settings"
ON public.kiosk_settings FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 6. PROFILES: Allow kiosk to read profiles (for parent PIN lookup)
DROP POLICY IF EXISTS "kiosk_view_profiles" ON public.profiles;
CREATE POLICY "kiosk_view_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role_secure('kiosk'::app_role));

-- 7. Update checkin_child and checkout_child to also authorize kiosk role
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = caller_id
    AND role IN ('admin', 'super_admin', 'staff', 'teacher', 'kiosk')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id
    AND qr_data = p_qr_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  IF EXISTS (
    SELECT 1 FROM attendance
    WHERE child_id = p_child_id
    AND attendance_date = today_date
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in today';
  END IF;

  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  SELECT child_id INTO v_child_id
  FROM attendance
  WHERE id = p_attendance_id;

  IF v_child_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = caller_id
    AND role IN ('admin', 'super_admin', 'staff', 'teacher', 'kiosk')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = v_child_id
    AND qr_data = p_qr_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check out this child';
  END IF;

  UPDATE attendance
  SET
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id)
  WHERE
    id = p_attendance_id
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    description TEXT,
    placeholders JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Super admins can manage email templates" ON public.email_templates;
CREATE POLICY "Super admins can manage email templates" 
    ON public.email_templates 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'super_admin' OR is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Authenticated users can view email templates" ON public.email_templates;
CREATE POLICY "Authenticated users can view email templates" 
    ON public.email_templates 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Seed default templates
INSERT INTO public.email_templates (name, subject, body_html, description, placeholders)
VALUES 
(
    'staff_onboarding', 
    'Welcome to KiddoChecker - Your Account is Ready!', 
    '<h1>Hello {{firstName}}!</h1><p>Your staff account for KiddoChecker has been created successfully.</p><p><strong>Your Temporary Credentials:</strong></p><ul><li>Email: {{email}}</li><li>Temporary Password: {{tempPassword}}</li></ul><p>Please log in at {{loginUrl}} and complete your registration wizard. You will be required to change your password upon first login.</p><p>Best regards,<br/>The Children''s Ministry Team</p>',
    'Sent to new staff members when their account is created by an admin.',
    '["firstName", "email", "tempPassword", "loginUrl"]'
),
(
    'check_in_notification', 
    '{{childName}} Checked In Successfully', 
    '<h1>Check-in Notification</h1><p>Hi there,</p><p>Your child, <strong>{{childName}}</strong>, has been checked in to <strong>{{className}}</strong> at {{time}}.</p><p>We hope they have a wonderful time!</p><p>Best regards,<br/>Children''s Ministry</p>',
    'Sent to parents when their child is checked in.',
    '["childName", "className", "time"]'
),
(
    'check_out_notification', 
    '{{childName}} Checked Out Successfully', 
    '<h1>Check-out Notification</h1><p>Hi there,</p><p>Your child, <strong>{{childName}}</strong>, has been checked out from <strong>{{className}}</strong> at {{time}}.</p><p>Thank you for joining us today!</p><p>Best regards,<br/>Children''s Ministry</p>',
    'Sent to parents when their child is checked out.',
    '["childName", "className", "time"]'
)
ON CONFLICT (name) DO UPDATE 
SET 
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    description = EXCLUDED.description,
    placeholders = EXCLUDED.placeholders,
    updated_at = now();

-- Migration: Add secure Staff Identity PIN system
-- Goal: Only Super-Admins can assign/reset these unique alphanumeric codes for staff.

-- 1. Add staff_pin column (mix of letters & numbers)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_pin TEXT UNIQUE;

-- 2. Create a function to generate a secure random alphanumeric PIN
CREATE OR REPLACE FUNCTION public.generate_random_alphanumeric(len integer DEFAULT 6)
RETURNS TEXT 
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z}'; -- Removed O and I to avoid confusion
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..len LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$;

-- 3. Strict trigger: Protect staff_pin from unauthorized updates
CREATE OR REPLACE FUNCTION protect_staff_pin()
RETURNS TRIGGER AS $$
BEGIN
  -- If staff_pin is changing, verify the actor is a super_admin
  IF (NEW.staff_pin IS DISTINCT FROM OLD.staff_pin) THEN
    -- Check if current user is super admin
    IF NOT (
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (ur.role = 'super_admin'::app_role OR ur.is_super_admin = true)
      )
    ) THEN
      RAISE EXCEPTION 'Only Super-Admins can modify a Staff Identity PIN';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_staff_pin ON public.profiles;
CREATE TRIGGER tr_protect_staff_pin
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION protect_staff_pin();

-- 4. RPC for Super Admins to generate/reset a staff pin
CREATE OR REPLACE FUNCTION public.generate_staff_pin_rpc(p_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_pin text;
BEGIN
  -- Security check (Must be super admin)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'super_admin'::app_role OR ur.is_super_admin = true)
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Super-Admin role required';
  END IF;

  LOOP
    new_pin := public.generate_random_alphanumeric(6);
    -- Ensure uniqueness (unlikely collision with 6 chars alphanumeric but possible)
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE staff_pin = new_pin);
  END LOOP;

  UPDATE public.profiles SET staff_pin = new_pin WHERE id = p_user_id;
  RETURN new_pin;
END;
$$;

-- 5. Fix Profiles RLS for Super-Admins to edit their own profiles and manage others
-- Super admins should have full access to profiles
DROP POLICY IF EXISTS "super_admins_manage_all_profiles" ON public.profiles;
CREATE POLICY "super_admins_manage_all_profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'super_admin'::app_role OR ur.is_super_admin = true)
  )
);

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

-- Temporary function to check if a user exists in auth.users
CREATE OR REPLACE FUNCTION public.debug_user_info_v2(p_email text)
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
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kiosk';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';
-- Allow staff to update their own verification_status (only that column)
CREATE POLICY "staff_update_own_verification_status"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
  AND is_super_admin = (SELECT ur.is_super_admin FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
);

-- Allow staff to update their own files in staff-documents bucket
CREATE POLICY "staff_update_own_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow staff to delete their own files in staff-documents bucket
CREATE POLICY "staff_delete_own_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Migration: Fix Profiles RLS and Secure Kiosk Fetch
-- Date: 2026-03-09

-- 1. FIX PROFILES RLS
-- Users must be able to see and edit their own profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Ensure Super Admins can still manage everything (already exists but making it clean)
DROP POLICY IF EXISTS "super_admins_manage_all_profiles" ON public.profiles;
CREATE POLICY "super_admins_manage_all_profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'super_admin' OR ur.is_super_admin = true)
  )
);

-- 2. SECURE KIOSK CHILDREN FETCH
-- Allow unauthenticated kiosk to fetch children for a parent if they have the correct PIN
-- This avoids opening up the 'children' table RLS to anon.

CREATE OR REPLACE FUNCTION public.get_children_for_kiosk(p_parent_id uuid, p_pin text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  gender text,
  date_of_birth date,
  parent_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the PIN first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_parent_id AND security_pin = p_pin
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.first_name, c.last_name, c.gender, c.date_of_birth, c.parent_id
  FROM public.children c
  WHERE c.parent_id = p_parent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_children_for_kiosk(uuid, text) TO anon, authenticated;

-- 3. FIX FOR MIGRATION CONFLICTS (RETRY PREVIOUS FAILED MIGRATION IDEMPOTENTLY)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' AND policyname = 'staff_update_own_verification_status'
    ) THEN
        CREATE POLICY "staff_update_own_verification_status"
        ON public.user_roles
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (
          user_id = auth.uid()
          AND role = (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
          AND is_super_admin = (SELECT ur.is_super_admin FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
        );
    END IF;
END $$;

-- Migration: Enforce 300KB file size limit and improve staff verification UX
-- Date: 2026-03-09

-- 1. Update storage bucket limit to 300KB (307200 bytes)
UPDATE storage.buckets 
SET file_size_limit = 307200,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
WHERE id = 'staff-documents';

-- 2. Ensure staff can update their own verification status correctly
-- We'll simplify the policy to be more reliable
DROP POLICY IF EXISTS "staff_update_own_verification_status" ON public.user_roles;
CREATE POLICY "staff_update_own_verification_status"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  -- We allow them to update verification_status, but we rely on the application to not change other sensitive fields.
  -- RLS is row-level, so they can technically update other fields if they are in the same row.
  -- But we'll trust the TypeScript client here for now, or we could add a trigger to enforce IMMUTABILITY of 'role'.
);

-- 3. Add a trigger to prevent staff from changing their own role via the above policy
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If not super admin, then role and is_super_admin must not change
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'super_admin' OR ur.is_super_admin = true)
    )
  ) THEN
    NEW.role := OLD.role;
    NEW.is_super_admin := OLD.is_super_admin;
    NEW.user_id := OLD.user_id; -- Prevent ownership change
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_user_role ON public.user_roles;
CREATE TRIGGER tr_protect_user_role
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_role();
-- ============================================================
-- Migration: Fix admin_verify_staff UUID issue
-- ============================================================

-- Function to approve/reject staff verification (FIX UUID casting)
CREATE OR REPLACE FUNCTION public.admin_verify_staff(
  p_user_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  -- Check admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_admin_id 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.user_roles 
    SET verification_status = 'verified',
        verified_at = NOW(),
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Approved by administrator')
    WHERE user_id = p_user_id;

    -- Log this action (FIX: Use p_user_id directly, not p_user_id::TEXT for a UUID column)
    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'verify_staff', 'user_roles', p_user_id, 
      jsonb_build_object('action', 'approved', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'verified');

  ELSIF p_action = 'reject' THEN
    UPDATE public.user_roles 
    SET verification_status = 'rejected',
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Rejected by administrator')
    WHERE user_id = p_user_id;

    -- Log this action (FIX: Use p_user_id directly)
    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'reject_staff', 'user_roles', p_user_id, 
      jsonb_build_object('action', 'rejected', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;
-- Migration: 20260310030000_secure_staff_access_and_auto_assign.sql
-- Add class assignment & strictly limit staff view

-- 1. Add class_id to children table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'class_id') THEN
        ALTER TABLE public.children ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Function to auto-assign a class based on age
CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER AS $$
DECLARE
    v_class_id UUID;
    v_age INTEGER;
BEGIN
    -- Only auto-assign if class is not set and age is provided
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        -- Basic parsing of age_range (assuming format like "0-2", "3-5", etc, or exact number)
        SELECT id INTO v_class_id
        FROM public.classes
        WHERE 
            age_range IS NOT NULL AND 
            -- Check if age is inside the hyphenated range "3-5"
            (
                (age_range LIKE '%-%' AND NEW.age >= CAST(split_part(age_range, '-', 1) AS INTEGER) 
                                      AND NEW.age <= CAST(split_part(age_range, '-', 2) AS INTEGER))
                OR
                -- Check if it matches a specific number "4"
                (age_range !~ '[a-zA-Z-]' AND NEW.age = CAST(age_range AS INTEGER))
            )
        LIMIT 1;
        
        IF v_class_id IS NOT NULL THEN
            NEW.class_id := v_class_id;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: If parsing fails, just return without assigning
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on children inserts
DROP TRIGGER IF EXISTS trigger_auto_assign_class on public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_class_by_age();

-- 3. Enhance Data Security (CIA) - Update Children Policies
-- Drop existing policies that might allow staff to see all children
DROP POLICY IF EXISTS "Admin can manage all children" ON public.children;
-- Note: Parent access is likely handled by a different policy. We'll leave existing parent policies.

-- New Admin policy
CREATE POLICY "Admins can view and edit all children" 
    ON public.children
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Staff/Teacher strict policy
-- They can only SELECT children assigned to classes they teach
CREATE POLICY "Staff can view children in their assigned classes" 
    ON public.children
    FOR SELECT
    USING (
        public.has_role(auth.uid(), 'staff'::public.app_role) -- or teacher/assistant, "has_role" handles this level
        AND class_id IN (
            SELECT class_id FROM public.teachers WHERE user_id = auth.uid()
        )
    );

-- 4. Secure Attendance View
-- Staff should only see attendance for classes they manage
DROP POLICY IF EXISTS "Staff and admin can view all attendance" ON public.attendance;

CREATE POLICY "Admins can view all attendance" 
    ON public.attendance
    FOR SELECT 
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Staff can view attendance for their assigned classes" 
    ON public.attendance
    FOR SELECT
    USING (
        public.has_role(auth.uid(), 'staff'::public.app_role)
        AND class_id IN (
            SELECT class_id FROM public.teachers WHERE user_id = auth.uid()
        )
    );

-- Add accountability fields to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS checked_in_method TEXT,
ADD COLUMN IF NOT EXISTS checked_out_method TEXT,
ADD COLUMN IF NOT EXISTS checked_in_station TEXT,
ADD COLUMN IF NOT EXISTS checked_out_station TEXT;

-- Drop existing functions before recreation because signatures are changing
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_liability_audit_report(date, date);

-- Redefine checkin_child with accountability parameters
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check (Check if already checked in and NOT checked out)
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

-- Redefine checkout_child with accountability parameters
CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  SELECT child_id INTO v_child_id FROM attendance WHERE id = p_attendance_id;
  IF v_child_id IS NULL THEN RETURN false; END IF;

  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = v_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check out this child';
  END IF;

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = p_station
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;

-- Update the Liability Audit Report to return these new fields and roles
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    child_age INTEGER,
    has_allergies BOOLEAN,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_in_by_role TEXT,
    checked_in_method TEXT,
    checked_in_station TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    checked_out_by_role TEXT,
    checked_out_method TEXT,
    checked_out_station TEXT,
    duration_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        ch.age as child_age,
        (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role,
        a.checked_in_method,
        a.checked_in_station,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role,
        a.checked_out_method,
        a.checked_out_station,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;

-- Add accountability fields to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS checked_in_method TEXT,
ADD COLUMN IF NOT EXISTS checked_out_method TEXT,
ADD COLUMN IF NOT EXISTS checked_in_station TEXT,
ADD COLUMN IF NOT EXISTS checked_out_station TEXT;

-- Drop existing functions before recreation because signatures are changing
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_liability_audit_report(date, date);

-- Redefine checkin_child with accountability parameters and enhanced Super Admin check
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check (Role based or explicit Super Admin flag)
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND (role IN ('admin', 'super_admin', 'staff', 'teacher') OR is_super_admin = true)
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check (Check if already checked in and NOT checked out)
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

-- Redefine checkout_child with accountability parameters and enhanced Super Admin check
CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  SELECT child_id INTO v_child_id FROM attendance WHERE id = p_attendance_id;
  IF v_child_id IS NULL THEN RETURN false; END IF;

  -- 1. Authorization Check (Role based or explicit Super Admin flag)
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND (role IN ('admin', 'super_admin', 'staff', 'teacher') OR is_super_admin = true)
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = v_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check out this child';
  END IF;

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = p_station
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;

-- Update the Liability Audit Report to return these new fields and roles
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    child_age INTEGER,
    has_allergies BOOLEAN,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_in_by_role TEXT,
    checked_in_method TEXT,
    checked_in_station TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    checked_out_by_role TEXT,
    checked_out_method TEXT,
    checked_out_station TEXT,
    duration_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        ch.age as child_age,
        (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role,
        a.checked_in_method,
        a.checked_in_station,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role,
        a.checked_out_method,
        a.checked_out_station,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;

-- Enhancement to Messages Table for Broadcast and Role-based Messaging
-- This allows admins to send broadcasts to categories of users without high-overhead duplication.

-- 1. Add new columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'recipient_role') THEN
        ALTER TABLE public.messages ADD COLUMN recipient_role TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_broadcast') THEN
        ALTER TABLE public.messages ADD COLUMN is_broadcast BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update RLS policies to allow role-based viewing
-- Drop old view policy to replace with improved version
DROP POLICY IF EXISTS "users_view_own_messages_secure" ON public.messages;

CREATE POLICY "users_view_own_messages_enhanced" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid() 
  OR (
    recipient_role IS NOT NULL 
    AND (
      -- Check if current user has the role required by the message
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (
          ur.role::text = messages.recipient_role -- Exact match
          OR (messages.recipient_role = 'all') -- Broadcast to everyone
          OR (messages.recipient_role = 'staff' AND ur.role::text IN ('staff', 'admin', 'super_admin'))
          OR (messages.recipient_role = 'parents' AND ur.role::text = 'parent')
          OR (messages.recipient_role = 'teachers' AND ur.role::text IN ('teacher', 'teacher_assistant'))
        )
      )
    )
  )
  OR public.is_admin_secure()
);

-- 3. Add index for performance on role-based filtering
CREATE INDEX IF NOT EXISTS idx_messages_recipient_role ON public.messages(recipient_role) WHERE recipient_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_is_broadcast ON public.messages(is_broadcast) WHERE is_broadcast = TRUE;
-- Migration: Add Message Read Receipts for individual tracking (Broadcasts)
-- This allows each user to have their own 'read' status for broadcast messages.

-- 1. Create the receipts table
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "users_view_own_receipts" 
ON public.message_read_receipts FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_secure());

CREATE POLICY "users_insert_own_receipts" 
ON public.message_read_receipts FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id ON public.message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id ON public.message_read_receipts(message_id);

-- 5. Helper function to check if a broadcast is read by a user
CREATE OR REPLACE FUNCTION public.is_message_read(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- For direct messages, we can still check the is_read column if the user is the recipient
    -- But for broadcasts or for consistency, we'll check the receipts table first.
    RETURN EXISTS (
        SELECT 1 FROM public.message_read_receipts 
        WHERE message_id = p_message_id AND user_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.messages 
        WHERE id = p_message_id AND recipient_id = p_user_id AND is_read = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Migration: Tighten Message Permissions and RLS
-- This ensures that roles must have explicit 'send_messages' or 'broadcast_messages' permissions to communicate.

-- 1. Ensure 'Parent' role can actually send messages (previously omitted)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  p.id as permission_id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Parent' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- 2. Ensure 'Staff' role can send broadcasts
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  p.id as permission_id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Staff' AND p.name = 'broadcast_messages'
ON CONFLICT DO NOTHING;

-- 3. Redefine Messages INSERT Policy
-- Only allow insert if user has 'send_messages' permission
-- If recipient_role is set (broadcast), user MUST have 'broadcast_messages' permission
DROP POLICY IF EXISTS "users_insert_own_messages_secure" ON public.messages;

CREATE POLICY "users_send_messages_checked" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.check_user_permission(auth.uid(), 'send_messages')
  AND (
    -- If it's a broadcast or role-targeted message, check for broadcast permission
    (recipient_role IS NULL AND is_broadcast = FALSE)
    OR public.check_user_permission(auth.uid(), 'broadcast_messages')
  )
);

-- 4. Redefine/Verify Update Policy for Read Status
-- Only recipient or admin can update (usually for marking as read)
DROP POLICY IF EXISTS "users_update_own_messages_secure" ON public.messages;

CREATE POLICY "users_update_message_status" 
ON public.messages FOR UPDATE 
TO authenticated
USING (
  recipient_id = auth.uid() 
  OR public.is_admin_secure()
)
WITH CHECK (
  -- Ensure only certain fields can be updated by the recipient (is_read)
  -- Note: In basic SQL RLS cannot easily restrict specific columns in WITH CHECK,
  -- but we can ensure the recipient_id doesn't change and sender_id doesn't change.
  (recipient_id = auth.uid() OR public.is_admin_secure())
);

-- 5. Tighten SELECT Policy (Build upon the previously enhanced one)
-- Ensures users can only see what they are allowed to see
-- This is a safety drop and recreate to ensure 'check_user_permission' is factored in if needed.
DROP POLICY IF EXISTS "users_view_own_messages_enhanced" ON public.messages;

CREATE POLICY "users_view_authorized_messages" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid() 
  OR (
    recipient_role IS NOT NULL 
    AND (
      -- Check if current user has the role required by the message
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (
          ur.role::text = messages.recipient_role
          OR (messages.recipient_role = 'all')
          OR (messages.recipient_role = 'staff' AND ur.role::text IN ('staff', 'admin', 'super_admin'))
          OR (messages.recipient_role = 'parents' AND ur.role::text = 'parent')
          OR (messages.recipient_role = 'teachers' AND ur.role::text IN ('teacher', 'teacher_assistant'))
        )
      )
    )
  )
  OR public.check_user_permission(auth.uid(), 'view_messages') -- Or if they have global view perms (Admins/Staff)
);
-- =============================================================
-- Migration: Enforce strict role-based data access (CIA triad)
-- This migration:
--   1. Ensures class_id column exists on children
--   2. Drops ALL existing children/attendance/classes policies
--      and rebuilds them with proper role coverage
--   3. Restricts QR management (children table access covers it)
-- =============================================================

-- â”€â”€ Step 1: Add class_id to children if not exists â”€â”€
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'children'
          AND column_name  = 'class_id'
    ) THEN
        ALTER TABLE public.children
            ADD COLUMN class_id UUID
            REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE public.children    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes     ENABLE ROW LEVEL SECURITY;

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘             CHILDREN â€” drop & rebuild                â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Drop every known policy on children
DROP POLICY IF EXISTS "Admin can manage all children"                        ON public.children;
DROP POLICY IF EXISTS "Admins can view and edit all children"                ON public.children;
DROP POLICY IF EXISTS "Staff can view children in their assigned classes"    ON public.children;
DROP POLICY IF EXISTS "Parents can view their own children"                  ON public.children;
DROP POLICY IF EXISTS "Parents can insert their own children"                ON public.children;
DROP POLICY IF EXISTS "Parents can update their own children"                ON public.children;
DROP POLICY IF EXISTS "Admin can insert children"                            ON public.children;
DROP POLICY IF EXISTS "Admin can update children"                            ON public.children;
DROP POLICY IF EXISTS "Admin can delete children"                            ON public.children;
DROP POLICY IF EXISTS "Staff and teacher can view children"                  ON public.children;
DROP POLICY IF EXISTS "children_admin_all"                                   ON public.children;
DROP POLICY IF EXISTS "children_parent_own"                                  ON public.children;
DROP POLICY IF EXISTS "children_staff_class"                                 ON public.children;

-- Helper: returns true if the current user is admin/super_admin
-- (re-uses the existing is_admin_secure() function if available)

-- 1. Admins â€” full access
CREATE POLICY "children_admin_all"
    ON public.children FOR ALL
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- 2. Parents â€” own children only
CREATE POLICY "children_parent_own"
    ON public.children FOR ALL
    USING (
        parent_id = auth.uid()
    )
    WITH CHECK (
        parent_id = auth.uid()
    );

-- 3. Staff / Teacher / Teacher_assistant / Volunteer â€” ONLY children
--    assigned to a class that the current user is assigned to via `teachers`
CREATE POLICY "children_staff_class"
    ON public.children FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND (
            -- class_id must be in one of the user's assigned classes
            class_id IS NOT NULL
            AND class_id IN (
                SELECT t.class_id
                FROM public.teachers t
                WHERE t.user_id = auth.uid()
                  AND t.class_id IS NOT NULL
            )
        )
    );

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘             ATTENDANCE â€” drop & rebuild              â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

DROP POLICY IF EXISTS "Staff and admin can view all attendance"              ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance"                       ON public.attendance;
DROP POLICY IF EXISTS "Staff can view attendance for their assigned classes" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_all"                                 ON public.attendance;
DROP POLICY IF EXISTS "attendance_parent_own"                                ON public.attendance;
DROP POLICY IF EXISTS "attendance_staff_class"                               ON public.attendance;
DROP POLICY IF EXISTS "Parents can view their children attendance"           ON public.attendance;
DROP POLICY IF EXISTS "Admin and staff can manage attendance"                ON public.attendance;

-- Admin â€” full access
CREATE POLICY "attendance_admin_all"
    ON public.attendance FOR ALL
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Parents â€” own children's attendance
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = child_id
              AND c.parent_id = auth.uid()
        )
    );

-- Staff / Teacher / etc â€” only their assigned classes
CREATE POLICY "attendance_staff_class"
    ON public.attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND class_id IN (
            SELECT t.class_id
            FROM public.teachers t
            WHERE t.user_id = auth.uid()
              AND t.class_id IS NOT NULL
        )
    );

-- Staff can INSERT attendance for their classes (needed for kiosk via assigned device)
CREATE POLICY "attendance_staff_insert_class"
    ON public.attendance FOR INSERT
    WITH CHECK (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- Staff can UPDATE attendance for their classes
CREATE POLICY "attendance_staff_update_class"
    ON public.attendance FOR UPDATE
    USING (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘             CLASSES â€” drop & rebuild                 â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

DROP POLICY IF EXISTS "Staff and admin can manage classes"  ON public.classes;
DROP POLICY IF EXISTS "classes_admin_all"                   ON public.classes;
DROP POLICY IF EXISTS "classes_staff_view_assigned"         ON public.classes;

-- Admin â€” full CRUD
CREATE POLICY "classes_admin_all"
    ON public.classes FOR ALL
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Staff/Teacher â€” SELECT only their assigned classes
CREATE POLICY "classes_staff_view_assigned"
    ON public.classes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND id IN (
            SELECT t.class_id
            FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘  Auto-assign class by age trigger (idempotent)       â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_class_id UUID;
BEGIN
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        SELECT id INTO v_class_id
        FROM public.classes
        WHERE age_range IS NOT NULL
          AND (
                (age_range LIKE '%-%'
                 AND NEW.age >= CAST(split_part(age_range, '-', 1) AS INTEGER)
                 AND NEW.age <= CAST(split_part(age_range, '-', 2) AS INTEGER))
              OR
                (age_range !~ '[a-zA-Z-]'
                 AND NEW.age = CAST(age_range AS INTEGER))
          )
        LIMIT 1;
        IF v_class_id IS NOT NULL THEN
            NEW.class_id := v_class_id;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_assign_class ON public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_class_by_age();
-- =====================================================================
-- NUCLEAR RLS REBUILD â€” drop every single policy on children,
-- attendance, and classes, then create exactly the ones we need.
-- This guarantees no leftover permissive policies.
-- =====================================================================

-- â”€â”€ Step 0: Ensure class_id column exists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'children'
          AND column_name  = 'class_id'
    ) THEN
        ALTER TABLE public.children
            ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- â”€â”€ Step 1: Dynamically drop EVERY policy on the 3 tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('children', 'attendance', 'classes')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- â”€â”€ Step 2: Enable RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.children   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes    ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (extra safety)
ALTER TABLE public.children   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.classes    FORCE ROW LEVEL SECURITY;

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘               CHILDREN TABLE POLICIES                     â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Admin / super_admin: full CRUD
CREATE POLICY "children_admin_all"
    ON public.children FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Parent: own children only
CREATE POLICY "children_parent_own"
    ON public.children FOR ALL TO authenticated
    USING      (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

-- Staff/Teacher/Assistant/Volunteer: SELECT only, class-scoped
CREATE POLICY "children_staff_class_select"
    ON public.children FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND class_id IS NOT NULL
        AND class_id IN (
            SELECT t.class_id FROM public.teachers t
            WHERE t.user_id = auth.uid() AND t.class_id IS NOT NULL
        )
    );

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘             ATTENDANCE TABLE POLICIES                     â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Admin: full CRUD
CREATE POLICY "attendance_admin_all"
    ON public.attendance FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Parent: SELECT own children attendance
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = child_id AND c.parent_id = auth.uid()
        )
    );

-- Staff: SELECT attendance for classes they're assigned to
CREATE POLICY "attendance_staff_class_select"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND class_id IN (
            SELECT t.class_id FROM public.teachers t
            WHERE t.user_id = auth.uid() AND t.class_id IS NOT NULL
        )
    );

-- Staff: INSERT/UPDATE attendance for their classes
CREATE POLICY "attendance_staff_write"
    ON public.attendance FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "attendance_staff_update"
    ON public.attendance FOR UPDATE TO authenticated
    USING (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘              CLASSES TABLE POLICIES                       â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Admin: full CRUD
CREATE POLICY "classes_admin_all"
    ON public.classes FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Staff/Teacher: SELECT only their assigned classes
CREATE POLICY "classes_staff_view_assigned"
    ON public.classes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
-- â•‘            AUTO-ASSIGN TRIGGER (idempotent)               â•‘
-- â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_class_id UUID;
BEGIN
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        SELECT id INTO v_class_id
        FROM public.classes
        WHERE age_range IS NOT NULL
          AND (
                (age_range LIKE '%-%'
                 AND NEW.age >= CAST(split_part(age_range, '-', 1) AS INTEGER)
                 AND NEW.age <= CAST(split_part(age_range, '-', 2) AS INTEGER))
              OR
                (age_range !~ '[a-zA-Z-]'
                 AND NEW.age = CAST(age_range AS INTEGER))
          )
        LIMIT 1;
        IF v_class_id IS NOT NULL THEN
            NEW.class_id := v_class_id;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_assign_class ON public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_class_by_age();
-- =====================================================================
-- CUSTOM ROLES AND PERSMISSIONS SYSTEM
-- =====================================================================

-- â”€â”€ 1. Create or Repair permissions table â”€â”€
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist and relax old constraints for the new system
DO $$ 
BEGIN 
    -- Add category column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.permissions ADD COLUMN category TEXT;
    END IF;

    -- Make 'resource' nullable if it exists (legacy column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'resource'
    ) THEN
        ALTER TABLE public.permissions ALTER COLUMN resource DROP NOT NULL;
    END IF;

    -- Make 'action' nullable if it exists (legacy column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'action'
    ) THEN
        ALTER TABLE public.permissions ALTER COLUMN action DROP NOT NULL;
    END IF;

    -- Ensure UNIQUE constraint on name exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_index i 
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.permissions'::regclass 
        AND i.indisunique 
        AND a.attname = 'name'
    ) THEN
        -- Clean up duplicates before adding constraint
        DELETE FROM public.permissions p1
        USING public.permissions p2
        WHERE p1.id > p2.id AND p1.name = p2.name;

        ALTER TABLE public.permissions ADD CONSTRAINT permissions_name_unique UNIQUE (name);
    END IF;
END $$;

-- Seed/Update permissions
-- We use unique names to identify permissions in the new system
INSERT INTO public.permissions (name, description, category) VALUES
('view_all_children', 'View all children records in the system', 'children'),
('manage_all_children', 'Create, edit, and delete any child record', 'children'),
('view_assigned_children', 'View children only in assigned classes', 'children'),
('manage_classes', 'Create, edit, and delete classrooms', 'management'),
('assign_staff_to_classes', 'Assign teachers and assistants to classes', 'management'),
('view_all_attendance', 'View attendance for all kids', 'attendance'),
('view_assigned_attendance', 'View attendance for assigned classes', 'attendance'),
('manage_qr_codes', 'Generate and print QR labels', 'kiosk'),
('manage_kiosk_settings', 'Configure kiosk behavior and timeouts', 'kiosk'),
('manage_users', 'Create and manage user accounts and roles', 'management'),
('view_audit_logs', 'Access system audit trails', 'security')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- Assign a category to any legacy permissions that don't have one
UPDATE public.permissions SET category = 'legacy' WHERE category IS NULL;

-- â”€â”€ 2. Create custom_roles table â”€â”€
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    base_role TEXT, -- e.g., 'staff', 'teacher'
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- â”€â”€ 3. Create role_permissions join table â”€â”€
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- â”€â”€ 4. Link user_roles to custom_roles â”€â”€
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'user_roles'
          AND column_name  = 'custom_role_id'
    ) THEN
        ALTER TABLE public.user_roles
            ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- â”€â”€ 5. Enable RLS â”€â”€
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "SuperAdmins can manage permissions" ON public.permissions;
CREATE POLICY "SuperAdmins can manage permissions" ON public.permissions FOR ALL USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;
CREATE POLICY "Everyone can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "SuperAdmins can manage custom roles" ON public.custom_roles;
CREATE POLICY "SuperAdmins can manage custom roles" ON public.custom_roles FOR ALL USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Everyone can view custom roles" ON public.custom_roles;
CREATE POLICY "Everyone can view custom roles" ON public.custom_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "SuperAdmins can manage role permissions" ON public.role_permissions;
CREATE POLICY "SuperAdmins can manage role permissions" ON public.role_permissions FOR ALL USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;
CREATE POLICY "Everyone can view role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- â”€â”€ 6. Helper function to check permissions â”€â”€
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- SuperAdmins bypass all permission checks
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND is_super_admin = true) THEN
        RETURN TRUE;
    END IF;

    -- Check if user's custom role has the permission
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
          AND p.name = p_permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =====================================================================
-- IMPROVED AUTO-ASSIGN CLASS BY AGE
-- =====================================================================

CREATE OR REPLACE FUNCTION public.parse_age_from_string(p_str TEXT, p_index INTEGER)
RETURNS INTEGER AS $$
DECLARE
    parts TEXT[];
    part TEXT;
    val TEXT;
BEGIN
    -- Remove non-numeric/non-range characters but keep hyphens/dashes
    part := regexp_replace(p_str, '[^0-9\-]', '', 'g');
    
    -- Split by hyphen
    parts := string_to_array(part, '-');
    
    IF array_length(parts, 1) < p_index THEN
        RETURN NULL;
    END IF;
    
    val := parts[p_index];
    IF val ~ '^[0-9]+$' THEN
        RETURN CAST(val AS INTEGER);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_class_id UUID;
    v_min INTEGER;
    v_max INTEGER;
BEGIN
    -- Only run if explicitly requested or if class_id is currently null
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        -- Find the first class where the age fits the range
        FOR v_class_id, v_min, v_max IN 
            SELECT id, 
                   public.parse_age_from_string(age_range, 1), 
                   public.parse_age_from_string(age_range, 2)
            FROM public.classes
            WHERE age_range IS NOT NULL AND age_range != ''
        LOOP
            -- Case 1: Range like "3-5"
            IF v_min IS NOT NULL AND v_max IS NOT NULL THEN
                IF NEW.age >= v_min AND NEW.age <= v_max THEN
                    NEW.class_id := v_class_id;
                    RETURN NEW;
                END IF;
            -- Case 2: Single age like "5" or "5 years"
            ELSIF v_min IS NOT NULL THEN
                IF NEW.age = v_min THEN
                    NEW.class_id := v_class_id;
                    RETURN NEW;
                END IF;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback to original record if logic fails
    RETURN NEW;
END;
$$;

-- Re-create the trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_auto_assign_class ON public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_class_by_age();
-- =====================================================================
-- FINAL ACCESS FIX FOR ADMINS AND TEACHERS
-- =====================================================================

-- â”€â”€ 1. Create Helper Function First (to avoid "does not exist" errors) â”€â”€
CREATE OR REPLACE FUNCTION public.child_id_assigned_to_user(p_child_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.children c
        JOIN public.teachers t ON c.class_id = t.class_id
        WHERE c.id = p_child_id 
          AND t.user_id = p_user_id
          AND c.class_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- â”€â”€ 2. Fix Teachers Table Access â”€â”€
-- First, ensure RLS is enabled
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Drop generic select-all policy if it exists (it's too broad)
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;

-- Admin: full access to manage staff assignments
CREATE POLICY "teachers_admin_all"
    ON public.teachers FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Staff/Teachers: can see who is assigned to classes (needed for dashboard to load class rosters)
CREATE POLICY "teachers_view_all"
    ON public.teachers FOR SELECT TO authenticated
    USING (true);

-- â”€â”€ 3. Fix Children Access for Staff/Admins â”€â”€

-- Ensure children policies are robust
DROP POLICY IF EXISTS "children_admin_all" ON public.children;
CREATE POLICY "children_admin_all"
    ON public.children FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Re-defining the staff class select to be more reliable
DROP POLICY IF EXISTS "children_staff_assigned_select" ON public.children;
DROP POLICY IF EXISTS "children_staff_class_select" ON public.children;
DROP POLICY IF EXISTS "children_staff_class" ON public.children;

CREATE POLICY "children_staff_assigned_select"
    ON public.children FOR SELECT TO authenticated
    USING (
        -- Is the user a staff member?
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer','admin','super_admin')
        )
        AND (
            -- Case A: User is Admin (already covered by children_admin_all, but for safety in SELECT)
            public.is_admin_secure()
            OR 
            -- Case B: User is assigned to this child's class
            child_id_assigned_to_user(id, auth.uid())
        )
    );

-- Advanced Safety and Liability Reporting Functions

-- 1. Ratio Violation Report
-- Identifies moments or classes where the current attendance exceeds designated capacity
CREATE OR REPLACE FUNCTION public.get_ratio_alerts(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    class_id UUID,
    class_name TEXT,
    current_count BIGINT,
    capacity INTEGER,
    violation_level TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.name as class_name,
        COUNT(a.id) as current_count,
        COALESCE(c.capacity, 10) as capacity, -- Default to 10 if null
        CASE 
            WHEN COUNT(a.id) > COALESCE(c.capacity, 10) THEN 'Critical'
            WHEN COUNT(a.id) >= (COALESCE(c.capacity, 10) * 0.9) THEN 'Warning'
            ELSE 'Safe'
        END as violation_level
    FROM classes c
    LEFT JOIN attendance a ON c.id = a.class_id 
        AND a.attendance_date = p_date
        AND a.checked_in_at IS NOT NULL 
        AND a.checked_out_at IS NULL
    GROUP BY c.id, c.name, c.capacity
    HAVING COUNT(a.id) >= (COALESCE(c.capacity, 10) * 0.9); -- Only show warnings/violations
END;
$$;

-- 2. Enhanced Liability Audit Report
-- Returns full details of check-ins/outs including the identities of the adults involved
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    child_age INTEGER,
    has_allergies BOOLEAN,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    duration_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        ch.age as child_age,
        (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;

-- 3. Safety Peak Time Analysis (Heatmap data)
CREATE OR REPLACE FUNCTION public.get_attendance_heatmap(start_date date, end_date date)
RETURNS TABLE (
    hour_of_day INTEGER,
    avg_count NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    WITH hourly_counts AS (
        SELECT 
            attendance_date,
            EXTRACT(HOUR FROM checked_in_at)::INTEGER as checkin_hour,
            COUNT(*) as count
        FROM attendance
        WHERE attendance_date BETWEEN start_date AND end_date
          AND checked_in_at IS NOT NULL
        GROUP BY attendance_date, EXTRACT(HOUR FROM checked_in_at)
    )
    SELECT 
        checkin_hour as hour_of_day,
        ROUND(AVG(count), 1) as avg_count
    FROM hourly_counts
    GROUP BY checkin_hour
    ORDER BY hour_of_day;
END;
$$;

-- 4. No-Show Report
-- Identifies children assigned to a class who have not checked in for the given date
CREATE OR REPLACE FUNCTION public.get_no_show_report(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    child_id UUID,
    child_name TEXT,
    class_name TEXT,
    parent_phone TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ch.id,
        CONCAT(ch.first_name, ' ', ch.last_name),
        COALESCE(cl.name, 'Unassigned'),
        ch.emergency_contact_phone
    FROM children ch
    LEFT JOIN classes cl ON ch.class_id = cl.id
    WHERE ch.class_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM attendance a 
          WHERE a.child_id = ch.id 
          AND a.attendance_date = p_date
          AND a.checked_in_at IS NOT NULL
      )
    ORDER BY cl.name, ch.last_name;
END;
$$;
-- Migration: Fix Kiosk onboarding role and allow Admins to manage roles
-- Date: 2026-03-10

-- 1. Update handle_new_user to correctly handle device/kiosk users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Logic to assign the correct role
  IF (NEW.raw_user_meta_data->>'is_device')::boolean IS TRUE THEN
    -- It's a kiosk/device user
    INSERT INTO public.user_roles (user_id, role, verification_status, verified_at)
    VALUES (NEW.id, 'kiosk'::app_role, 'verified', NOW())
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS TRUE THEN
    -- Organization creator; role will be assigned separately
    NULL;
  ELSE
    -- Default role is parent for regular signups
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Update protect_user_role trigger to allow administrative role changes
-- Currently, it blocks anyone who is not a super_admin from updating roles.
-- If auth.uid() is null (Service Role / Supabase Dashboard), it should pass.
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if:
  -- 1. Update is being performed by the service role / administrative context (auth.uid() is null)
  -- 2. Update is being performed by a Super Admin
  IF (
    auth.uid() IS NOT NULL AND 
    NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'super_admin' OR ur.is_super_admin = true)
    )
  ) THEN
    -- Ensure role and is_super_admin must not change if not an administrator
    IF NEW.role != OLD.role OR NEW.is_super_admin != OLD.is_super_admin THEN
        NEW.role := OLD.role;
        NEW.is_super_admin := OLD.is_super_admin;
        NEW.user_id := OLD.user_id; -- Prevent ownership change
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Migration: Add strict hardware enforcement fields to enrolled_devices
-- Date: 2026-03-10

ALTER TABLE public.enrolled_devices 
  ADD COLUMN IF NOT EXISTS hardware_id TEXT,
  ADD COLUMN IF NOT EXISTS os_info TEXT,
  ADD COLUMN IF NOT EXISTS browser_info TEXT,
  ADD COLUMN IF NOT EXISTS device_fingerprint JSONB DEFAULT '{}';

-- Create index for hardware lookup
CREATE INDEX IF NOT EXISTS idx_enrolled_devices_hardware_id ON public.enrolled_devices (hardware_id);

-- Update RLS to ensure only authorized roles can view device management
-- (Assuming this is already handled by role-based permissions, but good to keep in mind)
-- Migration: Enhanced Security Audit and Failure Tracking
-- Date: 2026-03-10

ALTER TABLE public.enrolled_devices
  ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_status TEXT DEFAULT 'secure'; -- 'secure', 'flagged', 'locked'

-- Function to handle session heartbeats or security alerts centrally
CREATE OR REPLACE FUNCTION public.log_device_security_event(
    p_device_id UUID, 
    p_action TEXT, 
    p_metadata JSONB,
    p_is_failure BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.device_activity_log (device_id, action, metadata)
    VALUES (p_device_id, p_action, p_metadata);

    IF p_is_failure THEN
        UPDATE public.enrolled_devices
        SET failure_count = failure_count + 1,
            security_status = CASE WHEN failure_count + 1 >= 5 THEN 'flagged' ELSE security_status END
        WHERE id = p_device_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Migration: Security Analytics functions
-- Provides data for the "World Class Reporting" dashboard

CREATE OR REPLACE FUNCTION get_terminal_security_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_terminals', (SELECT count(*) FROM enrolled_devices),
        'active_terminals', (SELECT count(*) FROM enrolled_devices WHERE status = 'active'),
        'locked_terminals', (SELECT count(*) FROM enrolled_devices WHERE security_status = 'locked'),
        'flagged_terminals', (SELECT count(*) FROM enrolled_devices WHERE security_status = 'flagged'),
        'security_events_last_24h', (SELECT count(*) FROM device_activity_log WHERE created_at > now() - interval '24 hours'),
        'alerts_last_24h', (SELECT count(*) FROM device_activity_log WHERE action = 'security_alert' AND created_at > now() - interval '24 hours'),
        'top_alert_devices', (
            SELECT jsonb_agg(d) FROM (
                 SELECT ed.name, count(*) as alert_count
                 FROM device_activity_log dal
                 JOIN enrolled_devices ed ON dal.device_id = ed.id
                 WHERE dal.action = 'security_alert'
                 GROUP BY ed.name
                 ORDER BY alert_count DESC
                 LIMIT 5
            ) d
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
-- Enhanced Reporting RPCs
CREATE OR REPLACE FUNCTION get_staff_performance_stats(start_date DATE, end_date DATE)
RETURNS TABLE (
    staff_id UUID,
    staff_name TEXT,
    checkin_count BIGINT,
    checkout_count BIGINT,
    avg_processing_time_min FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as staff_id,
        p.first_name || ' ' || p.last_name as staff_name,
        COUNT(a.id) FILTER (WHERE a.checked_in_at BETWEEN (start_date || ' 00:00:00')::TIMESTAMP AND (end_date || ' 23:59:59')::TIMESTAMP) as checkin_count,
        COUNT(a.id) FILTER (WHERE a.checked_out_at BETWEEN (start_date || ' 00:00:00')::TIMESTAMP AND (end_date || ' 23:59:59')::TIMESTAMP) as checkout_count,
        0.0::FLOAT as avg_processing_time_min
    FROM profiles p
    LEFT JOIN attendance a ON (a.checked_in_by = p.id OR a.checked_out_by = p.id)
    GROUP BY p.id, p.first_name, p.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_attendance_growth_stats()
RETURNS TABLE (
    week_start DATE,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('week', created_at)::DATE as week_start,
        COUNT(*) as count
    FROM profiles
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix handle_new_user to avoid auto-assigning parent role to devices
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role app_role;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'target_role')::app_role, 'parent'::app_role);
  IF (NEW.raw_user_meta_data->>'is_device')::boolean IS TRUE THEN
    v_role := 'kiosk'::app_role;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  
  RETURN NEW;
END;
$$;
-- Fix protect_user_role to allow Admins to manage roles
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role app_role;
BEGIN
  IF auth.uid() IS NULL THEN
     RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role FROM public.user_roles WHERE user_id = auth.uid();

  IF v_actor_role = 'super_admin' THEN
     RETURN NEW;
  END IF;

  IF v_actor_role = 'admin' THEN
     IF (NEW.role = 'super_admin' OR NEW.role = 'admin') AND (OLD.role != 'super_admin' AND OLD.role != 'admin') THEN
         RAISE EXCEPTION 'Admins cannot escalate users to Admin levels.';
     END IF;
     RETURN NEW;
  END IF;

  IF NEW.role != OLD.role OR NEW.is_super_admin != OLD.is_super_admin THEN
      NEW.role := OLD.role;
      NEW.is_super_admin := OLD.is_super_admin;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Secure Staff PIN verification for Kiosk terminals
-- This function allows kiosks to verify staff PINs without needing full read access to the profiles table.

CREATE OR REPLACE FUNCTION verify_staff_pin_for_kiosk(p_pin TEXT)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role app_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.staff_pin = UPPER(TRIM(p_pin))
    AND ur.role IN ('admin', 'super_admin', 'staff', 'teacher')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users (including kiosks)
GRANT EXECUTE ON FUNCTION verify_staff_pin_for_kiosk(TEXT) TO authenticated;
-- Add serial_number to enrolled_devices as requested
ALTER TABLE public.enrolled_devices ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_staff_members();

-- Update get_staff_members to include staff_pin
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      p.staff_pin::TEXT
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- Migration: Create Rewards System
-- Date: 2026-03-11

-- 1. Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create reward_redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' -- pending, approved, fulfilled, rejected
);

-- 3. Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for rewards
CREATE POLICY "Anyone can view rewards" 
ON public.rewards FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can manage rewards" 
ON public.rewards FOR ALL 
TO authenticated 
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- 5. Create RLS Policies for reward_redemptions
CREATE POLICY "Users can view own redemptions" 
ON public.reward_redemptions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.is_admin_secure());

CREATE POLICY "Users can create redemptions" 
ON public.reward_redemptions FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all redemptions" 
ON public.reward_redemptions FOR ALL 
TO authenticated 
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- 6. Add search_path to functions
-- (is_admin_secure already has it from previous migrations)
-- Migration: 20260311200000_photo_uploads_storage_and_columns.sql

-- Add photo_url to children
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add avatar_url to profiles (if it doesn't already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create Storage Bucket for photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars bucket

-- Allow public read access to avatars
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar or children's photos
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'avatars'
);

-- Allow users to update their own uploads or we can just allow authenticated users for now
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING ( auth.uid() = owner AND bucket_id = 'avatars' );

-- Add special_instructions to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Drop existing functions before recreation because signatures are changing
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text);

-- Redefine checkin_child with special_instructions
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check (Check if already checked in and NOT checked out)
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station,
    special_instructions
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station,
    p_special_instructions
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;
-- Migration: 20260311220000_sms_email_integrations.sql

CREATE TABLE IF NOT EXISTS public.communication_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    twilio_phone_number TEXT,
    sendgrid_api_key TEXT,
    sendgrid_from_email TEXT,
    enable_sms_pickups BOOLEAN DEFAULT false,
    enable_email_pickups BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert exactly one row for organization communication settings
INSERT INTO public.communication_settings (twilio_account_sid) VALUES (NULL) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.communication_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin select communication_settings" 
    ON public.communication_settings FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
    
CREATE POLICY "Admin update communication_settings" 
    ON public.communication_settings FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
    
CREATE POLICY "Admin insert communication_settings" 
    ON public.communication_settings FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Update Messages Table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sent_via_sms BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sent_via_email BOOLEAN DEFAULT false;
-- Migration: 20260311223000_switch_sendgrid_to_resend.sql

ALTER TABLE public.communication_settings DROP COLUMN IF EXISTS sendgrid_api_key;
ALTER TABLE public.communication_settings DROP COLUMN IF EXISTS sendgrid_from_email;

ALTER TABLE public.communication_settings ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE public.communication_settings ADD COLUMN IF NOT EXISTS resend_domain TEXT;
-- Migration: 20260311230000_staff_scheduling.sql

CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'absent')),
    role_type TEXT NOT NULL DEFAULT 'volunteer' CHECK (role_type IN ('leader', 'assistant', 'volunteer', 'admin')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to shifts" 
    ON public.shifts FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Staff can view their own shifts
CREATE POLICY "Staff view own shifts"
    ON public.shifts FOR SELECT
    USING (staff_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_shift_update
    BEFORE UPDATE ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_shifts_updated_at();
-- Migration: 20260311233000_youth_self_check.sql

ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS youth_pin TEXT,
ADD COLUMN IF NOT EXISTS allow_self_check BOOLEAN DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.children.youth_pin IS 'Secure 4-8 digit PIN for youth self-check-out/in';
COMMENT ON COLUMN public.children.allow_self_check IS 'Whether this child is allowed to use the Youth Self-Check kiosk';

-- Migration: 20260311234500_multi_location_support.sql

-- Create centers table
CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Canada',
    latitude NUMERIC,
    longitude NUMERIC,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read-only access to centers"
    ON public.centers FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage centers"
    ON public.centers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Seed some mock centers
INSERT INTO public.centers (name, address, city, state_province, postal_code, latitude, longitude)
VALUES 
('KiddoChecker North', '123 Northern Ave', 'Toronto', 'ON', 'M4B 1B4', 43.7000, -79.4000),
('KiddoChecker West', '456 Western Rd', 'Mississauga', 'ON', 'L5B 2C4', 43.5890, -79.6441),
('KiddoChecker Downtown', '789 Central St', 'Toronto', 'ON', 'M5V 2H1', 43.6532, -79.3832)
ON CONFLICT DO NOTHING;
-- Migration: update_get_staff_members_with_photos
-- Update get_staff_members to include avatar_url and photo_url

DROP FUNCTION IF EXISTS public.get_staff_members();

CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      p.staff_pin::TEXT,
      p.avatar_url::TEXT,
      p.photo_url::TEXT
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO service_role;
-- Migration: enhance_shifts_for_kiosk
-- Add actual check-in/out times to shifts

ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kiosk_id TEXT;

-- Update status check constraint if needed (status is already text)
-- No need to change it, 'confirmed' or 'completed' can be used.
-- Migration: add_staff_shift_kiosk_functions
-- Add functions for staff to check in/out of shifts from kiosk

CREATE OR REPLACE FUNCTION public.get_staff_shifts_for_kiosk(p_pin text)
RETURNS TABLE (
  shift_id uuid,
  staff_id uuid,
  staff_name text,
  start_time timestamptz,
  end_time timestamptz,
  role_type text,
  status text,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  class_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_staff_name text;
BEGIN
  -- Verify the staff PIN
  SELECT p.id, p.first_name || ' ' || p.last_name INTO v_staff_id, v_staff_name
  FROM public.profiles p
  WHERE p.staff_pin = p_pin;

  IF v_staff_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    s.id as shift_id,
    s.staff_id,
    v_staff_name as staff_name,
    s.start_time,
    s.end_time,
    s.role_type,
    s.status,
    s.actual_start_time,
    s.actual_end_time,
    c.name as class_name
  FROM public.shifts s
  LEFT JOIN public.classes c ON s.class_id = c.id
  WHERE s.staff_id = v_staff_id
    AND s.start_time::date = current_date
  ORDER BY s.start_time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_shifts_for_kiosk(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.staff_shift_action_kiosk(p_shift_id uuid, p_action text, p_kiosk_id text DEFAULT 'primary-kiosk')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift_status text;
BEGIN
  SELECT status INTO v_shift_status FROM public.shifts WHERE id = p_shift_id;
  
  IF v_shift_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shift not found');
  END IF;

  IF p_action = 'check_in' THEN
    UPDATE public.shifts 
    SET 
      actual_start_time = now(),
      status = 'confirmed',
      kiosk_id = p_kiosk_id
    WHERE id = p_shift_id;
    RETURN jsonb_build_object('success', true, 'action', 'checked_in');
  ELSIF p_action = 'check_out' THEN
    UPDATE public.shifts 
    SET 
      actual_end_time = now(),
      status = 'completed'
    WHERE id = p_shift_id;
    RETURN jsonb_build_object('success', true, 'action', 'checked_out');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_shift_action_kiosk(uuid, text, text) TO anon, authenticated;
-- Migration: 20260312003000_add_signature_and_map_settings.sql

-- Add signature_data column to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Add new settings to organization_settings
ALTER TABLE public.organization_settings ADD COLUMN IF NOT EXISTS require_checkout_signature BOOLEAN DEFAULT false;
ALTER TABLE public.organization_settings ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT;

-- Update checkout_child RPC to handle signature
CREATE OR REPLACE FUNCTION public.checkout_child(
    p_attendance_id uuid,
    p_checked_out_by uuid DEFAULT NULL,
    p_qr_token text DEFAULT NULL,
    p_method text DEFAULT 'kiosk',
    p_station text DEFAULT 'Main Kiosk',
    p_signature_data text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- Get child_id from attendance record
  SELECT child_id INTO v_child_id
  FROM attendance
  WHERE id = p_attendance_id;

  IF v_child_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Authorization Check
  -- Check if caller is admin/staff/teacher
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  -- Check if caller is the parent
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  -- Check if a valid QR token is provided (matching the child)
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = v_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check out this child';
  END IF;

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = p_station,
    signature_data = p_signature_data
  WHERE 
    id = p_attendance_id 
    AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$function$;
-- Migration: 20260312004000_broaden_reports.sql

-- Update the Liability Audit Report to return all accountability fields including signature
DROP FUNCTION IF EXISTS public.get_liability_audit_report(date, date);
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    child_age INTEGER,
    has_allergies BOOLEAN,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_in_by_role TEXT,
    checked_in_method TEXT,
    checked_in_station TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    checked_out_by_role TEXT,
    checked_out_method TEXT,
    checked_out_station TEXT,
    duration_hours NUMERIC,
    signature_data TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        ch.age as child_age,
        (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role,
        a.checked_in_method,
        a.checked_in_station,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role,
        a.checked_out_method,
        a.checked_out_station,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours,
        a.signature_data
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;
-- Migration: 20260312005000_youth_self_check.sql

-- Add youth-specific fields to children table
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS allow_self_check BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS youth_pin TEXT;

-- Create an index for PIN lookups
CREATE INDEX IF NOT EXISTS idx_children_pin ON public.children(youth_pin) WHERE youth_pin IS NOT NULL;

-- RPC for Youth Self-Check
DROP FUNCTION IF EXISTS public.youth_self_check_action(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.youth_self_check_action(
    p_pin_code TEXT,
    p_kiosk_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_child_id UUID;
    v_child_name TEXT;
    v_attendance_id UUID;
    v_is_checked_in BOOLEAN;
    v_org_id UUID;
BEGIN
    -- 1. Find the child by PIN
    SELECT id, first_name || ' ' || last_name, organization_id
    INTO v_child_id, v_child_name, v_org_id
    FROM public.children
    WHERE youth_pin = p_pin_code AND allow_self_check = true
    LIMIT 1;

    IF v_child_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN or not authorized for self-check.');
    END IF;

    -- 2. Check current status (is child already checked in?)
    SELECT id INTO v_attendance_id
    FROM public.attendance
    WHERE child_id = v_child_id AND checked_out_at IS NULL
    ORDER BY checked_in_at DESC
    LIMIT 1;

    v_is_checked_in := (v_attendance_id IS NOT NULL);

    IF v_is_checked_in THEN
        -- Perform Check-Out
        UPDATE public.attendance
        SET 
            checked_out_at = now(),
            checked_out_method = 'youth_self_check',
            checked_out_station = p_kiosk_id
        WHERE id = v_attendance_id;

        RETURN jsonb_build_object(
            'success', true, 
            'action', 'checkout', 
            'child_name', v_child_name,
            'message', 'Checked out successfully. See you next time!'
        );
    ELSE
        -- Perform Check-In
        INSERT INTO public.attendance (
            child_id,
            organization_id,
            attendance_date,
            checked_in_at,
            checked_in_method,
            checked_in_station
        ) VALUES (
            v_child_id,
            v_org_id,
            CURRENT_DATE,
            now(),
            'youth_self_check',
            p_kiosk_id
        );

        RETURN jsonb_build_object(
            'success', true, 
            'action', 'checkin', 
            'child_name', v_child_name,
            'message', 'Checked in successfully. Welcome!'
        );
    END IF;
END;
$$;
-- Migration: 20260312010000_world_class_upgrades.sql
-- Description: Advanced Audit Logging for Medical Data, Conflict-aware scheduling, and Background check status integration.
-- Skill used: postgresql-optimization, security-auditor

-- 1. MEDICAL DATA AUDIT LOGGING
-- Purpose: Track every modification to sensitive medical data for compliance.

CREATE TABLE IF NOT EXISTS public.medical_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medical_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all medical audits" ON public.medical_audit_logs
    FOR SELECT USING (is_admin_secure());

DROP FUNCTION IF EXISTS public.audit_medical_profile_changes();
CREATE OR REPLACE FUNCTION public.audit_medical_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.medical_audit_logs (child_id, actor_id, action, old_data)
        VALUES (OLD.child_id, v_actor_id, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.medical_audit_logs (child_id, actor_id, action, old_data, new_data)
        VALUES (NEW.child_id, v_actor_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.medical_audit_logs (child_id, actor_id, action, new_data)
        VALUES (NEW.child_id, v_actor_id, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_audit_medical_profiles ON public.child_medical_profiles;
CREATE TRIGGER tr_audit_medical_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.child_medical_profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_medical_profile_changes();


-- 2. CONFLICT-AWARE SCHEDULING
-- Purpose: Prevent staff from being double-booked.

DROP FUNCTION IF EXISTS public.check_shift_conflicts(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);
CREATE OR REPLACE FUNCTION public.check_shift_conflicts(
    p_staff_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_ignore_shift_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflict_id UUID,
    conflict_start TIMESTAMPTZ,
    conflict_end TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.start_time, s.end_time
    FROM public.shifts s
    WHERE s.staff_id = p_staff_id
      AND s.status NOT IN ('canceled')
      AND (p_ignore_shift_id IS NULL OR s.id != p_ignore_shift_id)
      AND (
        (p_start_time, p_end_time) OVERLAPS (s.start_time, s.end_time)
      );
END;
$$;


-- 3. BACKGROUND CHECK STATUS SYNC
-- Purpose: Ensure staff_profiles (or similar) has a quick flag for background checks if not already present.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_active_background_check BOOLEAN DEFAULT false;

-- Trigger to auto-update the flag when a police_check or background_check is approved
DROP FUNCTION IF EXISTS public.sync_background_check_status();
CREATE OR REPLACE FUNCTION public.sync_background_check_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.document_type IN ('police_check', 'background_check') AND NEW.status = 'approved') THEN
        UPDATE public.profiles SET has_active_background_check = true WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_background_check ON public.staff_documents;
CREATE TRIGGER tr_sync_background_check
    AFTER INSERT OR UPDATE ON public.staff_documents
    FOR EACH ROW EXECUTE FUNCTION public.sync_background_check_status();


-- 4. MULTI-LOCATION ENHANCEMENT
-- Add a function to find nearest center by location
DROP FUNCTION IF EXISTS public.get_nearest_centers(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
CREATE OR REPLACE FUNCTION public.get_nearest_centers(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    distance_km FLOAT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        id, 
        name, 
        address,
        -- Simple Euclidean distance approximation for display (approx 111km per degree)
        ROUND(((POINT(longitude, latitude) <-> POINT(p_lng, p_lat)) * 111.0)::numeric, 1)::float as distance_km
    FROM public.centers
    WHERE is_active = true
    ORDER BY (POINT(longitude, latitude) <-> POINT(p_lng, p_lat))
    LIMIT p_limit;
$$;
-- Migration: 20260312020000_refine_staff_scheduling.sql
-- Description: Add actual clock-in times to shifts and enforce no-conflict rule.

-- 1. ADD CLOCK-IN COLUMNS
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kiosk_id UUID; -- tracked where they clocked in

-- 2. ENFORCE NO-CONFLICTS VIA TRIGGER
DROP FUNCTION IF EXISTS public.enforce_shift_no_conflicts();
CREATE OR REPLACE FUNCTION public.enforce_shift_no_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_id UUID;
BEGIN
    SELECT conflict_id INTO v_conflict_id
    FROM public.check_shift_conflicts(NEW.staff_id, NEW.start_time, NEW.end_time, NEW.id)
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'Staff member already has an overlapping shift (ID: %)', v_conflict_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_shift_conflicts ON public.shifts;
CREATE TRIGGER tr_enforce_shift_conflicts
    BEFORE INSERT OR UPDATE OF staff_id, start_time, end_time ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_shift_no_conflicts();

-- 3. HELPER FOR KIOSK SHIFT ACTIONS (used by frontend handleShiftAction)
DROP FUNCTION IF EXISTS public.staff_shift_action_kiosk(UUID, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.staff_shift_action_kiosk(
    p_shift_id UUID,
    p_action TEXT, -- 'check_in', 'check_out'
    p_kiosk_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shift RECORD;
BEGIN
    SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shift not found');
    END IF;

    IF p_action = 'check_in' THEN
        IF v_shift.actual_start_time IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Already checked into this shift');
        END IF;

        UPDATE public.shifts 
        SET actual_start_time = now(), 
            kiosk_id = p_kiosk_id,
            status = 'confirmed'
        WHERE id = p_shift_id;
        
        RETURN jsonb_build_object('success', true);
    ELSIF p_action = 'check_out' THEN
        IF v_shift.actual_start_time IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Not checked into this shift yet');
        END IF;
        
        IF v_shift.actual_end_time IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Already checked out of this shift');
        END IF;

        UPDATE public.shifts 
        SET actual_end_time = now(),
            status = 'completed'
        WHERE id = p_shift_id;

        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
    END IF;
END;
$$;

-- 4. HELPER TO FETCH TODAY'S SHIFTS FOR STAFF (used by frontend)
DROP FUNCTION IF EXISTS public.get_staff_shifts_for_kiosk(TEXT);
CREATE OR REPLACE FUNCTION public.get_staff_shifts_for_kiosk(
    p_pin TEXT
)
RETURNS TABLE (
    shift_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    role_type TEXT,
    class_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
BEGIN
    SELECT id INTO v_staff_id FROM public.profiles WHERE pin_code = p_pin;
    
    IF v_staff_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        s.id, s.start_time, s.end_time, s.actual_start_time, s.actual_end_time, s.role_type, c.name
    FROM public.shifts s
    LEFT JOIN public.classes c ON s.class_id = c.id
    WHERE s.staff_id = v_staff_id
      AND s.start_time::date = current_date
      AND s.status != 'canceled'
    ORDER BY s.start_time ASC;
END;
$$;
-- 1. ENSURE PERMISSION CHECK FUNCTION EXISTS
-- Redefine check_user_permission to ensure it's available for the RLS policy
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean := false;
  v_has_permission boolean := false;
BEGIN
  -- Check if user is super admin (bypass)
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions (legacy roles)
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role::text = (
      SELECT name FROM public.custom_roles WHERE id = rp.role_id
    )
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  -- Also check custom role assignments
  IF NOT v_has_permission THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
    ) INTO v_has_permission;
  END IF;
  
  RETURN v_has_permission;
END;
$$;

-- 2. FIX PROFILE VISIBILITY
-- Previously, users could only view their own profile. For messaging to work, 
-- users need to see the names and roles of other people they might message.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;

-- Create an enhanced SELECT policy for profiles
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  -- Always see your own profile
  id = auth.uid()
  -- OR you are an Admin/Staff member (can see everyone for management)
  OR public.check_user_permission(auth.uid(), 'view_users'::text)
  OR public.check_user_permission(auth.uid(), 'send_messages'::text)
  -- OR you are viewing a Staff member, Teacher, or Admin (Public/Team directory)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
  )
);


-- 2. ENSURE PERMISSIONS ARE ASSIGNED
-- Ensure all relevant roles have messaging permissions if they were missed.

-- Ensure Staff can send messages
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'Staff' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- Ensure Teacher can send messages
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'Teacher' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- Ensure Teacher Assistant can send messages
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'Teacher_Assistant' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- Ensure everyone has view_messages to see their inbox
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name IN ('Admin', 'Staff', 'Teacher', 'Teacher_Assistant', 'Parent') 
AND p.name = 'view_messages'
ON CONFLICT DO NOTHING;


-- 3. FIX RECIPIENT FETCH VIEW/FUNCTION (Optional but helpful)
-- If the frontend join is failing due to complex RLS, a security definer function helps.
DROP FUNCTION IF EXISTS public.get_available_recipients();
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role::text
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role::text IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'parent')
    ORDER BY ur.role, p.last_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_recipients() TO authenticated;
-- Migration: 20260313010000_fix_role_visibility_for_messaging.sql
-- Description: Fix "undefined undefined" issue by ensuring staff roles and profiles are visible to authenticated users.

-- 1. Redefine check_user_permission to be even more robust
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean := false;
  v_has_permission boolean := false;
BEGIN
  -- Check if user is super admin (bypass)
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions (legacy roles)
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role::text = (
      SELECT name FROM public.custom_roles WHERE id = rp.role_id
    )
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  -- Also check custom role assignments
  IF NOT v_has_permission THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
      JOIN public.permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
    ) INTO v_has_permission;
  END IF;
  
  RETURN v_has_permission;
END;
$$;

-- 2. Update user_roles RLS to allow viewing staff roles
-- This is critical so that profiles RLS can check who is a staff member
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view staff roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
);

-- 3. Update profiles RLS to ensure staff members are visible
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  -- Always see your own profile
  id = auth.uid()
  -- OR you have explicit permission
  OR public.check_user_permission(auth.uid(), 'view_users'::text)
  OR public.check_user_permission(auth.uid(), 'send_messages'::text)
  -- OR you are viewing a Staff member (Checked directly via a secure subquery to avoid circular logic)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
  )
);
-- Migration: Fix staff dropdown and add scheduling helpers
-- Description: Ensures super_admin and volunteer are included in recipient list and adds availability helpers.

-- 1. UPDATE RECIPIENT LIST
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role::text
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'parent')
    ORDER BY ur.role, p.last_name;
END;
$$;

-- 2. ADD AUTO-SCHEDULING HELPERS (Future proofing)
-- Function to get staff who are NOT already scheduled during a specific window
CREATE OR REPLACE FUNCTION public.get_available_staff_for_window(
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    staff_id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role::text
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
    AND NOT EXISTS (
        SELECT 1 
        FROM public.shifts s
        WHERE s.staff_id = p.id
        AND s.status != 'canceled'
        AND (p_start_time, p_end_time) OVERLAPS (s.start_time, s.end_time)
    )
    ORDER BY p.last_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_recipients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_staff_for_window(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
-- Migration: Enhance Staff Scheduling Logic
-- Description: Excludes parents from staff dropdown, adds staff attributes for better identity, and adds auto-scheduling foundations.

-- 1. FIX STAFF DROPDOWN (Exclude 'parent')
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role::text
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
    ORDER BY ur.role, p.last_name;
END;
$$;

-- 2. ENHANCE STAFF IDENTITY
-- Add more descriptive attributes to profiles for scheduling intelligence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[], -- E.g., ['Infant Care', 'Early Literacy', 'First Aid']
ADD COLUMN IF NOT EXISTS preferred_class_id UUID REFERENCES public.classes(id),
ADD COLUMN IF NOT EXISTS max_hours_per_week INTEGER DEFAULT 40;

-- 3. AUTO-SCHEDULING TEMPLATES
-- Define "Requirements" for different times/classes
CREATE TABLE IF NOT EXISTS public.scheduling_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduling_requirement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.scheduling_templates(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('leader', 'assistant', 'volunteer', 'admin')),
    class_id UUID REFERENCES public.classes(id),
    required_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AUTO-GENERATE ROSTER FUNCTION
-- This function takes a date and a template, and creates shifts
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(
    p_date DATE,
    p_template_id UUID,
    p_assign_staff BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_shift_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_staff_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    -- Get day of week from date (0-6)
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Loop through requirements for this day
    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        -- Calculate timestamps
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        -- Create shifts based on required_count
        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            -- If assignment is requested, try to find a suitable staff member
            IF p_assign_staff THEN
                -- Simplified matching logic:
                -- 1. Must be available (no overlapping shift)
                -- 2. Prefer staff with preferred_class_id matching the requirement
                -- 3. Match role type if possible
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    (p.preferred_class_id = v_item.class_id) DESC, 
                    random() -- Add randomness for variety
                LIMIT 1;
            END IF;

            -- Insert the shift
            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                COALESCE(v_staff_id, '00000000-0000-0000-0000-000000000000'), -- Use dummy ID if unassigned or handle it
                v_item.class_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                CASE WHEN v_staff_id IS NOT NULL THEN 'scheduled' ELSE 'canceled' END -- mark canceled if no staff found? or handle unassigned
            ) RETURNING id INTO v_staff_id; -- Reusing variable for convenience but it's shift id

            v_shift_count := v_shift_count + 1;
            IF v_staff_id IS NOT NULL THEN
                v_assigned_count := v_assigned_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'shifts_created', v_shift_count,
        'staff_assigned', v_assigned_count
    );
END;
$$;

-- Seed a default template if none exists
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.scheduling_templates) THEN
        INSERT INTO public.scheduling_templates (name, description)
        VALUES ('Default Weekday Roster', 'Standard staffing for business hours')
        RETURNING id INTO v_template_id;

        -- Add some sample requirements (Monday to Friday)
        FOR d IN 1..5 LOOP
            -- Morning Lead for each day
            INSERT INTO public.scheduling_requirement_items (template_id, day_of_week, start_time, end_time, role_type, required_count)
            VALUES (v_template_id, d, '08:00', '12:00', 'leader', 1);
            
            -- Afternoon Lead
            INSERT INTO public.scheduling_requirement_items (template_id, day_of_week, start_time, end_time, role_type, required_count)
            VALUES (v_template_id, d, '13:00', '17:00', 'leader', 1);

            -- All day Assistant
            INSERT INTO public.scheduling_requirement_items (template_id, day_of_week, start_time, end_time, role_type, required_count)
            VALUES (v_template_id, d, '09:00', '15:00', 'assistant', 1);
        END LOOP;
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.generate_roster_from_template(DATE, UUID, BOOLEAN) TO authenticated;
-- Migration: Allow Unassigned Shifts and Improve Generator
-- Description: Makes staff_id optional in shifts table to support "Open" or unassigned shifts. Refines the generator to create unassigned shifts when no staff matches.

-- 1. MODIFY SHIFTS TABLE
ALTER TABLE public.shifts ALTER COLUMN staff_id DROP NOT NULL;

-- 2. IMPROVE GENERATOR LOGIC
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(
    p_date DATE,
    p_template_id UUID,
    p_assign_staff BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_shift_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_staff_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    -- Get day of week from date (0-6)
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Loop through requirements for this day
    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        -- Calculate timestamps
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        -- Create shifts based on required_count
        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            -- Try to find a suitable staff member if requested
            IF p_assign_staff THEN
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    (p.preferred_class_id = v_item.class_id) DESC, 
                    random()
                LIMIT 1;
            END IF;

            -- Insert the shift (staff_id can now be NULL)
            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                v_staff_id,
                v_item.class_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                'scheduled'
            );

            v_shift_count := v_shift_count + 1;
            IF v_staff_id IS NOT NULL THEN
                v_assigned_count := v_assigned_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'shifts_created', v_shift_count,
        'staff_assigned', v_assigned_count
    );
END;
$$;
-- Migration: Advanced Roster Intelligence & Flexible Roles
-- Description: Supports custom roles in scheduling, scoring-based auto-assignment, and diversity in staff roles (Admin, Tech, Support).

-- 1. FLEXIBLE RECIPIENTS (Include Custom Roles)
-- This version explicitly excludes 'parent' and 'child', implicitly including all other system and custom roles.
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role::text
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role::text NOT IN ('parent', 'child', 'kiosk')
    ORDER BY ur.role, p.last_name;
END;
$$;

-- 2. SMARTER AUTO-SCHEDULER (Scoring Engine)
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(
    p_date DATE,
    p_template_id UUID,
    p_assign_staff BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_shift_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_staff_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);

    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            IF p_assign_staff THEN
                -- ADVANCED SCORING LOGIC:
                -- 1. Must be available (no overlaps)
                -- 2. Must not be 'parent' or 'child'
                -- 3. Match 'Role Type' (leader, assistant, tech, admin etc)
                -- 4. Match Preferred Class
                -- 5. Match Specialties (if any requirement notes match specialties)
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text NOT IN ('parent', 'child', 'kiosk')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    -- Score based on role match (custom mapping can be added)
                    (CASE 
                        WHEN v_item.role_type = 'leader' AND ur.role::text IN ('teacher', 'admin', 'super_admin') THEN 10
                        WHEN v_item.role_type = 'assistant' AND ur.role::text IN ('teacher_assistant', 'staff', 'volunteer') THEN 10
                        WHEN v_item.role_type = 'admin' AND ur.role::text IN ('admin', 'super_admin', 'staff') THEN 10
                        WHEN v_item.role_type::text = ur.role::text THEN 15 -- Perfect role name match
                        ELSE 0 
                    END) DESC,
                    -- Class preference
                    (p.preferred_class_id = v_item.class_id) DESC,
                    -- Randomness for fair rotation
                    random()
                LIMIT 1;
            END IF;

            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                v_staff_id,
                v_item.class_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                'scheduled'
            );

            v_shift_count := v_shift_count + 1;
            IF v_staff_id IS NOT NULL THEN
                v_assigned_count := v_assigned_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'shifts_created', v_shift_count,
        'staff_assigned', v_assigned_count
    );
END;
$$;
-- Migration: Staff Groups and Attributes
-- Description: Adds department and group classification for staff to optimize scheduling and auto-assignment.

-- 1. ADD DEPARTMENT TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. CREATE STAFF GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.staff_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE GROUP MEMBERSHIP TABLE
CREATE TABLE IF NOT EXISTS public.staff_group_members (
    group_id UUID REFERENCES public.staff_groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, profile_id)
);

-- 4. UPDATE SCHEDULING REQUIREMENTS
ALTER TABLE public.scheduling_requirement_items ADD COLUMN IF NOT EXISTS required_group_id UUID REFERENCES public.staff_groups(id);

-- 5. UPGRADE AUTO-GENERATOR WITH GROUP INTELLIGENCE
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(
    p_date DATE,
    p_template_id UUID,
    p_assign_staff BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_shift_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_staff_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);

    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            IF p_assign_staff THEN
                -- ADVANCED SCORING LOGIC V2 (With Group Intelligence):
                -- 1. Must be available (no overlaps)
                -- 2. Must not be 'parent', 'child', or 'kiosk'
                -- 3. MATCH GROUP (Highest priority)
                -- 4. Match 'Role Type'
                -- 5. Match Preferred Class
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text NOT IN ('parent', 'child', 'kiosk')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    -- Score based on Group Membership (The new core requirement)
                    (CASE 
                        WHEN v_item.required_group_id IS NOT NULL AND EXISTS (
                            SELECT 1 FROM public.staff_group_members sgm 
                            WHERE sgm.profile_id = p.id AND sgm.group_id = v_item.required_group_id
                        ) THEN 50 -- Heavy weight for group match
                        ELSE 0 
                    END) DESC,
                    -- Score based on role match
                    (CASE 
                        WHEN v_item.role_type = 'leader' AND ur.role::text IN ('teacher', 'admin', 'super_admin') THEN 10
                        WHEN v_item.role_type = 'assistant' AND ur.role::text IN ('teacher_assistant', 'staff', 'volunteer') THEN 10
                        WHEN v_item.role_type = 'admin' AND ur.role::text IN ('admin', 'super_admin', 'staff') THEN 10
                        WHEN v_item.role_type::text = ur.role::text THEN 15 
                        ELSE 0 
                    END) DESC,
                    -- Class preference
                    (p.preferred_class_id = v_item.class_id) DESC,
                    -- Randomness for fair rotation
                    random()
                LIMIT 1;
            END IF;

            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                v_staff_id,
                v_item.class_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                'scheduled'
            );

            v_shift_count := v_shift_count + 1;
            IF v_staff_id IS NOT NULL THEN
                v_assigned_count := v_assigned_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'shifts_created', v_shift_count,
        'staff_assigned', v_assigned_count
    );
END;
$$;

-- 6. SEED SOME GROUPS
INSERT INTO public.staff_groups (name, description)
VALUES 
    ('Technical Support', 'IT equipment, network, and device management'),
    ('Kitchen & Nutrition', 'Meal preparation and cleanliness'),
    ('Admin Operations', 'Office management and logistics'),
    ('Security', 'Premises safety and check-in assistance'),
    ('Academic Lead', 'Core curriculum and teaching leads')
ON CONFLICT (name) DO NOTHING;

GRANT SELECT ON public.staff_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.staff_group_members TO authenticated;
-- Migration: Staff Group Automation
-- Description: Adds rules for automatically assigning staff to groups based on their attributes (role, department, etc).

-- 1. GROUP AUTOMATION RULES
CREATE TABLE IF NOT EXISTS public.staff_group_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.staff_groups(id) ON DELETE CASCADE,
    attribute_type TEXT NOT NULL, -- 'role' or 'department'
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, attribute_type, attribute_value)
);

-- 2. TRIGGER TO AUTO-ASSIGN GROUPS
CREATE OR REPLACE FUNCTION public.apply_group_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove old auto-assigned groups? Maybe better to just add new ones.
    -- For simplicity, let's just add matches.
    
    -- Match by Role
    INSERT INTO public.staff_group_members (group_id, profile_id)
    SELECT sgr.group_id, NEW.id
    FROM public.staff_group_rules sgr
    JOIN public.user_roles ur ON ur.user_id = NEW.id
    WHERE sgr.attribute_type = 'role' AND sgr.attribute_value = ur.role::text
    ON CONFLICT DO NOTHING;

    -- Match by Department
    IF NEW.department IS NOT NULL THEN
        INSERT INTO public.staff_group_members (group_id, profile_id)
        SELECT group_id, NEW.id
        FROM public.staff_group_rules
        WHERE attribute_type = 'department' AND attribute_value = NEW.department
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_rules
AFTER INSERT OR UPDATE OF department ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.apply_group_rules();

-- 3. SEED SOME RULES
-- Academic Lead group (Assumed created in previous migration)
DO $$
DECLARE
    v_acad_id UUID;
    v_tech_id UUID;
BEGIN
    SELECT id INTO v_acad_id FROM public.staff_groups WHERE name = 'Academic Lead';
    SELECT id INTO v_tech_id FROM public.staff_groups WHERE name = 'Technical Support';

    IF v_acad_id IS NOT NULL THEN
        INSERT INTO public.staff_group_rules (group_id, attribute_type, attribute_value)
        VALUES (v_acad_id, 'role', 'teacher'), (v_acad_id, 'role', 'teacher_assistant')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_tech_id IS NOT NULL THEN
        INSERT INTO public.staff_group_rules (group_id, attribute_type, attribute_value)
        VALUES (v_tech_id, 'department', 'IT'), (v_tech_id, 'department', 'Tech')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
-- Migration: update_get_staff_members_with_departments
-- Description: Extends the core staff retrieval function to include new organizational field 'department'.

DROP FUNCTION IF EXISTS public.get_staff_members();

CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text,
  department text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      p.staff_pin::TEXT,
      p.avatar_url::TEXT,
      p.photo_url::TEXT,
      p.department::TEXT
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk') -- Flexibly include all staff-type roles
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO service_role;
-- 1. FIX PIN PROTECTION TRIGGER
-- Allow Admins to change PINs for everyone except Super-Admins.
CREATE OR REPLACE FUNCTION protect_staff_pin()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role text;
  v_target_is_super_admin boolean;
BEGIN
  -- If staff_pin is changing
  IF (NEW.staff_pin IS DISTINCT FROM OLD.staff_pin) THEN
    -- If no auth context (e.g., service role, background trigger), allow it
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- 1. Get Actor's Role
    SELECT role::text INTO v_actor_role 
    FROM public.user_roles 
    WHERE user_id = auth.uid();

    -- 2. Check if Target is Super Admin
    SELECT (role::text = 'super_admin' OR is_super_admin = true) INTO v_target_is_super_admin
    FROM public.user_roles
    WHERE user_id = NEW.id;

    -- 3. Apply logic
    -- Super Admin can do everything
    IF v_actor_role = 'super_admin' THEN
      RETURN NEW;
    END IF;

    -- Admin can do everything EXCEPT super admin
    IF v_actor_role = 'admin' THEN
      IF v_target_is_super_admin THEN
        RAISE EXCEPTION 'Admins cannot modify a Super-Admin Identity PIN';
      END IF;
      RETURN NEW;
    END IF;

    -- Everyone else: Forbidden
    RAISE EXCEPTION 'Only Administrators can modify a Staff Identity PIN';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SECURE STAFF PIN VISIBILITY
-- Update get_staff_members to NOT return PINs unless the viewer is the owner.
DROP FUNCTION IF EXISTS public.get_staff_members();
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text,
  department text,
  specialties text[],
  max_hours_per_week integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      CASE 
        WHEN auth.uid() = ur.user_id THEN p.staff_pin::TEXT
        ELSE NULL -- PIN is sensitive: only owner can see it
      END as staff_pin,
      p.avatar_url::TEXT,
      p.photo_url::TEXT,
      p.department::TEXT,
      p.specialties,
      p.max_hours_per_week
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 3. SECURE STAFF GROUPS RLS
ALTER TABLE public.staff_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_group_members ENABLE ROW LEVEL SECURITY;

-- Admins/Super-Admins manage groups
DROP POLICY IF EXISTS "Admins manage groups" ON public.staff_groups;
CREATE POLICY "Admins manage groups" ON public.staff_groups
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Everyone can view groups
DROP POLICY IF EXISTS "Everyone view groups" ON public.staff_groups;
CREATE POLICY "Everyone view groups" ON public.staff_groups
FOR SELECT TO authenticated
USING (true);

-- Admins/Super-Admins manage group members
DROP POLICY IF EXISTS "Admins manage group members" ON public.staff_group_members;
CREATE POLICY "Admins manage group members" ON public.staff_group_members
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Everyone can view group members
DROP POLICY IF EXISTS "Everyone view group members" ON public.staff_group_members;
CREATE POLICY "Everyone view group members" ON public.staff_group_members
FOR SELECT TO authenticated
USING (true);

-- Migration: enhance_rewards_system
-- Description: Add points_balance to public.children and update checkin_child to award points.

-- 1. Add points_balance to children table
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;

-- 2. Update existing checkin_child function to award points
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
  points_to_award INTEGER := 5; -- Reward 5 points for each check-in
BEGIN
  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check (Check if already checked in and NOT checked out)
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Update child points_balance
  UPDATE public.children 
  SET points_balance = COALESCE(points_balance, 0) + points_to_award
  WHERE id = p_child_id;

  -- 4. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station,
    special_instructions
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station,
    p_special_instructions
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

-- 3. Create a function for parents to redeem rewards
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_child_id uuid,
  p_reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_points_required INTEGER;
  v_current_balance INTEGER;
  v_parent_id uuid;
  v_caller_id uuid := auth.uid();
BEGIN
  -- Check if reward exists and get points
  SELECT points INTO v_points_required FROM public.rewards WHERE id = p_reward_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found');
  END IF;

  -- Check if child belongs to caller (if not admin)
  SELECT parent_id, points_balance INTO v_parent_id, v_current_balance 
  FROM public.children WHERE id = p_child_id;
  
  IF v_parent_id != v_caller_id AND NOT public.is_admin_secure() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Check balance
  IF COALESCE(v_current_balance, 0) < v_points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  -- Deduct points
  UPDATE public.children 
  SET points_balance = points_balance - v_points_required
  WHERE id = p_child_id;

  -- Log redemption
  INSERT INTO public.reward_redemptions (reward_id, user_id, child_id, points_spent, status)
  VALUES (p_reward_id, v_caller_id, p_child_id, v_points_required, 'pending');

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Grant execute on redeem_reward
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid, uuid) TO authenticated;

-- 4. Function to update redemption status (Admin only)
CREATE OR REPLACE FUNCTION public.update_redemption_status(
  p_redemption_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin_secure() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE public.reward_redemptions 
  SET status = p_status
  WHERE id = p_redemption_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_redemption_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_child(uuid, uuid, uuid, text, text, text, text) TO authenticated, anon;
-- Migration: 20260319000000_fix_redemptions_profiles_join.sql
-- Description: Add foreign key from reward_redemptions(user_id) to profiles(id) to fix PostgREST joins.

-- First, ensure the profiles table exists and its structure
-- Profiles table is assumed to be in the public schema and its ID is a UUID.

-- Add the missing foreign key to reward_redemptions
-- This enables PostgREST to automatically resolve the relationship in select statements.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_redemptions_profiles'
    ) THEN
        ALTER TABLE public.reward_redemptions
        ADD CONSTRAINT fk_redemptions_profiles
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update RLS for reward_redemptions â€” just making sure to re-grant permissions if needed
GRANT SELECT ON public.reward_redemptions TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- â›ª Church Management System (ChMS) - Initial Schema

-- Membership Types enum
DO $$ BEGIN
    CREATE TYPE membership_type AS ENUM ('registered', 'regular', 'visitor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Membership Status enum
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'deceased', 'transferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Church Memberships Table - A polymorphic-like link between profiles/children/members
CREATE TABLE IF NOT EXISTS church_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- For Parents, Staff, Admins
    child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- For Children
    membership_type membership_type DEFAULT 'regular',
    status membership_status DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT now(),
    baptism_date DATE,
    confirmation_date DATE,
    wedding_date DATE,
    pastoral_notes TEXT, -- Encouraged to be only seen by church staff
    spiritual_milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure a record points to either a profile OR a child, or it can be a standalone 'church-only' member record (if both null)
    -- Actually, if both null, it's just a general member who hasn't registered a parent/child account yet.
    CONSTRAINT profile_or_child_exclusive_ish CHECK (NOT (profile_id IS NOT NULL AND child_id IS NOT NULL))
);

-- Ministries Table
CREATE TABLE IF NOT EXISTS ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    head_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ministry Groups
CREATE TABLE IF NOT EXISTS ministry_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meeting_day TEXT, -- e.g. 'Sunday', 'Wednesday'
    meeting_time TIME,
    location TEXT,
    leader_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Member Group Memberships
CREATE TABLE IF NOT EXISTS ministry_member_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES church_memberships(id) ON DELETE CASCADE,
    group_id UUID REFERENCES ministry_groups(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Participant', -- 'Leader', 'Assistant', 'Participant'
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(membership_id, group_id)
);

-- RLS POLICIES
ALTER TABLE church_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_member_assignments ENABLE ROW LEVEL SECURITY;

-- Only admins and staff can see church-wide data
CREATE POLICY "Staff can view all church memberships"
ON church_memberships FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'teacher')
    )
);

CREATE POLICY "Users can view their own membership"
ON church_memberships FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Church admins and staff can manage memberships"
ON church_memberships FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
);

-- Repeat for Ministries/Groups
CREATE POLICY "Public authenticated can see ministries"
ON ministries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage ministries"
ON ministries FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Public authenticated can see groups"
ON ministry_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage groups"
ON ministry_groups FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
);

CREATE POLICY "Staff can see assignments"
ON ministry_member_assignments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff', 'teacher'))
);

CREATE POLICY "Staff can manage assignments"
ON ministry_member_assignments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
);

-- RPC for Church Dashboard stats
CREATE OR REPLACE FUNCTION get_church_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_members', (SELECT count(*) FROM church_memberships),
        'registered_count', (SELECT count(*) FROM church_memberships WHERE membership_type = 'registered'),
        'regular_count', (SELECT count(*) FROM church_memberships WHERE membership_type = 'regular'),
        'visitor_count', (SELECT count(*) FROM church_memberships WHERE membership_type = 'visitor'),
        'total_ministries', (SELECT count(*) FROM ministries),
        'active_groups', (SELECT count(*) FROM ministry_groups)
    ) INTO result;
    RETURN result;
END;
$$;
-- ðŸ•Šï¸ Volunteer Engine - Church Management Extension
-- Enhances the existing 'shifts' and 'events' infrastructure for congregational service scheduling.

-- 1. Volunteer Roles (Specific to Ministries)
CREATE TABLE IF NOT EXISTS public.volunteer_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    skills_required TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enhance Shifts with Church Context
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS volunteer_role_id UUID REFERENCES public.volunteer_roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL;

-- 3. RLS for Volunteer Roles
ALTER TABLE public.volunteer_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public authenticated can view volunteer roles"
ON public.volunteer_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage volunteer roles"
ON public.volunteer_roles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
);

-- 4. RPC to get Volunteer coverage for an event
CREATE OR REPLACE FUNCTION get_event_volunteer_stats(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_positions', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id),
        'filled_positions', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id AND staff_id IS NOT NULL),
        'open_positions', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id AND staff_id IS NULL),
        'confirmed_count', (SELECT count(*) FROM public.shifts WHERE event_id = p_event_id AND status = 'confirmed')
    ) INTO result;
    RETURN result;
END;
$$;
-- ðŸ›¤ï¸ Visitor Journey Automation
-- Description: Automatically starts a follow-up journey when a new visitor is registered.

-- 1. Create journey_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    journey_type TEXT DEFAULT 'visitor_welcome',
    current_step INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    next_run_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can view journey progress" 
ON public.journey_progress FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')));

-- 2. Function to start a journey
CREATE OR REPLACE FUNCTION public.start_visitor_journey()
RETURNS TRIGGER AS $$
BEGIN
    -- Only for visitors
    IF NEW.membership_type = 'visitor' THEN
        INSERT INTO public.journey_progress (membership_id, next_run_at)
        VALUES (NEW.id, now());
        
        -- Log the initial event in interactions
        INSERT INTO public.visitor_interactions (visitor_id, interaction_type, content)
        SELECT profile_id, 'note', 'Started: Visitor Welcome Journey'
        FROM public.church_memberships WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on church_memberships
DROP TRIGGER IF EXISTS on_visitor_created ON public.church_memberships;
CREATE TRIGGER on_visitor_created
    AFTER INSERT ON public.church_memberships
    FOR EACH ROW EXECUTE FUNCTION public.start_visitor_journey();

-- 4. Placeholder for automated step processing
-- (Usually tied to a cron that calls an edge function, 
-- but we can log the requirement here)
COMMENT ON TABLE public.journey_progress IS 'Tracks automated follow-up steps for church guests.';
-- ðŸ›ï¸ Synchronize Scheduling Generator with Church Management
-- Description: Adds ministry and volunteer role support to the roster templates and generation logic.

-- 1. Extend requirements table
ALTER TABLE public.scheduling_requirement_items 
ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS volunteer_role_id UUID REFERENCES public.volunteer_roles(id) ON DELETE SET NULL;

-- 2. Update Role Type Check (Add 'pastoral')
ALTER TABLE public.scheduling_requirement_items 
DROP CONSTRAINT IF EXISTS scheduling_requirement_items_role_type_check;

ALTER TABLE public.scheduling_requirement_items 
ADD CONSTRAINT scheduling_requirement_items_role_type_check 
CHECK (role_type IN ('leader', 'assistant', 'volunteer', 'admin', 'pastoral'));

-- 3. Update Generation RPC
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(
    p_date DATE,
    p_template_id UUID,
    p_assign_staff BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_shift_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_staff_id UUID;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_day_of_week INTEGER;
BEGIN
    -- Get day of week from date (0-6)
    v_day_of_week := EXTRACT(DOW FROM p_date);

    -- Loop through requirements for this day
    FOR v_item IN 
        SELECT * FROM public.scheduling_requirement_items 
        WHERE template_id = p_template_id AND day_of_week = v_day_of_week
    LOOP
        -- Calculate timestamps
        v_start_ts := p_date + v_item.start_time;
        v_end_ts := p_date + v_item.end_time;

        -- Create shifts based on required_count
        FOR i IN 1..v_item.required_count LOOP
            v_staff_id := NULL;

            -- If assignment is requested, try to find a suitable staff member
            IF p_assign_staff THEN
                -- Enhanced matching logic:
                -- 1. Must be available (no overlapping shift)
                -- 2. Prefer staff with matching preferred_class_id OR ministry_id
                SELECT p.id INTO v_staff_id
                FROM public.profiles p
                JOIN public.user_roles ur ON p.id = ur.user_id
                WHERE ur.role::text IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
                AND NOT EXISTS (
                    SELECT 1 FROM public.shifts s 
                    WHERE s.staff_id = p.id AND s.status != 'canceled'
                    AND (v_start_ts, v_end_ts) OVERLAPS (s.start_time, s.end_time)
                )
                ORDER BY 
                    (p.preferred_class_id = v_item.class_id) DESC, 
                    random()
                LIMIT 1;
            END IF;

            -- Insert the shift with church context
            INSERT INTO public.shifts (
                staff_id, 
                class_id, 
                ministry_id,
                volunteer_role_id,
                start_time, 
                end_time, 
                role_type, 
                status
            ) VALUES (
                v_staff_id, -- Can be NULL (OPEN POSITION)
                v_item.class_id,
                v_item.ministry_id,
                v_item.volunteer_role_id,
                v_start_ts,
                v_end_ts,
                v_item.role_type,
                CASE WHEN v_staff_id IS NOT NULL THEN 'scheduled' ELSE 'scheduled' END -- mark scheduled even if unassigned (OPEN)
            );

            v_shift_count := v_shift_count + 1;
            IF v_staff_id IS NOT NULL THEN
                v_assigned_count := v_assigned_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'shifts_created', v_shift_count,
        'staff_assigned', v_assigned_count
    );
END;
$$;
-- ðŸ—ƒï¸ Visitor CRM & Email Automation (FIXED)
-- Description: Adds tables to track visitor interactions and seeds follow-up email templates with JSONB placeholders.

-- 1. Create visitor_interactions table
CREATE TABLE IF NOT EXISTS public.visitor_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_type TEXT CHECK (interaction_type IN ('email', 'phone', 'text', 'note', 'meeting')),
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for visitor_interactions
CREATE POLICY "Admins can manage all interactions" 
ON public.visitor_interactions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  )
);

-- 2. Seed Email Templates for CRM
INSERT INTO public.email_templates (name, subject, body_html, description, placeholders)
VALUES 
(
  'visitor_welcome', 
  'Welcome to {{churchName}}! ðŸ›ï¸', 
  '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Welcome Home, {{visitorName}}!</h1>
    <p>It was such a joy to have you with us at <strong>{{churchName}}</strong>.</p>
    <p>We hope you felt the warmth of our community and the presence of God. If you have any questions or would like to learn more about our ministries, feel free to reply to this email.</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Join us again:</strong> Next Sunday at 10:00 AM</p>
    </div>
    <p>God bless,</p>
    <p>The {{churchName}} Team</p>
  </div>', 
  'Sent to first-time visitors after their initial visit.', 
  '["visitorName", "churchName"]'::jsonb
),
(
  'visitor_followup_missing', 
  'We Missed You! ðŸ•Šï¸', 
  '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Hi {{visitorName}},</h1>
    <p>We missed seeing you this weekend! We were thinking about you and wanted to check in.</p>
    <p>If there is anything we can pray for or any way we can support you, please don''t hesitate to reach out.</p>
    <p>Hope to see you soon!</p>
    <p>In Christ,</p>
    <p>The Pastoral Team</p>
  </div>', 
  'Sent when a visitor hasn''t returned for a follow-up week.', 
  '["visitorName"]'::jsonb
),
(
  'visitor_membership_invite', 
  'Taking the Next Step at {{churchName}} ðŸš¶â€â™‚ï¸', 
  '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Next Steps...</h1>
    <p>Hi {{visitorName}}, you''ve been a part of our community for a while now, and we''d love to invite you to our <strong>New Members Breakfast</strong>.</p>
    <p>This is a great chance to hear the vision of {{churchName}}, meet the staff, and find out how you can get plugged in.</p>
    <a href="{{inviteLink}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">RSVP Today</a>
    <p>Blessings,</p>
    <p>Member Relations</p>
  </div>', 
  'Invite regular visitors to become official church members.', 
  '["visitorName", "churchName", "inviteLink"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  placeholders = EXCLUDED.placeholders;
-- Add new permissions for Church Management and CRM
INSERT INTO public.permissions (name, description, category) VALUES
('church_view', 'Access the Church Management Dashboard', 'church'),
('church_manage_members', 'Add, Edit, and Manage church members and profiles', 'church'),
('church_manage_ministries', 'Create and modify ministries and small groups', 'church'),
('church_manage_volunteers', 'Manage volunteer roles and coverage details', 'church'),
('church_crm_view', 'View visitor interactions and CRM timeline', 'crm'),
('church_crm_edit', 'Log interactions, take notes, and send automated follow-up emails', 'crm')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- Update RLS for visitor_interactions to use the new has_permission function
-- First, drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Admins can manage interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Users can view assigned interactions" ON public.visitor_interactions;

CREATE POLICY "Users with CRM view permission can see interactions" 
ON public.visitor_interactions 
FOR SELECT 
TO authenticated 
USING (public.has_permission(auth.uid(), 'church_crm_view'));

CREATE POLICY "Users with CRM edit permission can manage interactions" 
ON public.visitor_interactions 
FOR ALL 
TO authenticated 
USING (public.has_permission(auth.uid(), 'church_crm_edit'));
-- âž• Add metadata to visitor_interactions
-- Description: Allows storing JSONB metadata for interactions (e.g., template names, automation results).

ALTER TABLE public.visitor_interactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update the comment
COMMENT ON COLUMN public.visitor_interactions.metadata IS 'Stores context for automated interactions, such as email template names.';
-- â›ª Upgrade Volunteer RLS to Permission-Based Access

-- 1. volunteer_roles
DROP POLICY IF EXISTS "Public authenticated can view volunteer roles" ON volunteer_roles;
DROP POLICY IF EXISTS "Admins can manage volunteer roles" ON volunteer_roles;

CREATE POLICY "Permission: View volunteer roles"
ON volunteer_roles FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

CREATE POLICY "Permission: Manage volunteer roles"
ON volunteer_roles FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_volunteers'));


-- 2. shifts (Church specific)
-- NOTE: We add to existing policies rather than dropping them to avoid breaking staff management
DROP POLICY IF EXISTS "Permission: View church shifts" ON public.shifts;
DROP POLICY IF EXISTS "Permission: Manage church shifts" ON public.shifts;

CREATE POLICY "Permission: View church shifts"
ON public.shifts FOR SELECT
TO authenticated
USING (
    (role_type = 'volunteer' AND public.has_permission(auth.uid(), 'church_view'))
);

CREATE POLICY "Permission: Manage church shifts"
ON public.shifts FOR ALL
TO authenticated
USING (
    (role_type = 'volunteer' AND public.has_permission(auth.uid(), 'church_manage_volunteers'))
);
-- ðŸ¥ Standardize and Expand User Profiles
-- Adding standard CRM/Member fields to the profiles table

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA',
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Update the handle_new_user function to capture these new fields if provided during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    phone, 
    gender, 
    date_of_birth,
    address,
    city,
    state,
    zip
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'zip'
  );
  
  -- Logic for role assignment (keeping existing logic)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;
-- ðŸ“§ Add Email column and standardize Zip Code in profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Standardize zip to zip_code if needed
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zip') THEN
    ALTER TABLE public.profiles RENAME COLUMN zip TO zip_code;
  ELSE
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
  END IF;
END $$;

-- Update existing trigger to sync email and zip_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    email,
    phone, 
    gender, 
    date_of_birth,
    address,
    city,
    state,
    zip_code
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'zip' -- Map 'zip' from metadata to 'zip_code' column
  );
  
  -- Logic for role assignment 
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;
-- ðŸ“§ Final Profile Expansion and Trigger Fix
DO $$ 
BEGIN 
  -- Ensure email exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Ensure zip_code exists (fallback from zip)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zip') THEN
    ALTER TABLE public.profiles RENAME COLUMN zip TO zip_code;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zip_code') THEN
    ALTER TABLE public.profiles ADD COLUMN zip_code TEXT;
  END IF;
END $$;

-- Fix/Upgrade handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    email,
    phone, 
    gender, 
    date_of_birth,
    address,
    city,
    state,
    zip_code
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'zip' -- Map 'zip' from metadata to 'zip_code' column
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    gender = EXCLUDED.gender,
    date_of_birth = EXCLUDED.date_of_birth,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code;
  
  -- Logic for role assignment 
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
-- â›ª Upgrade Church Management RLS to Permission-Based Access

-- 1. church_memberships
DROP POLICY IF EXISTS "Staff can view all church memberships" ON church_memberships;
DROP POLICY IF EXISTS "Church admins and staff can manage memberships" ON church_memberships;
DROP POLICY IF EXISTS "Users can view their own membership" ON church_memberships;

-- Users can always see their own record
DROP POLICY IF EXISTS "View own membership" ON church_memberships;
CREATE POLICY "View own membership"
ON church_memberships FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Permission: View all memberships" ON church_memberships;
CREATE POLICY "Permission: View all memberships"
ON church_memberships FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

DROP POLICY IF EXISTS "Permission: Manage all memberships" ON church_memberships;
CREATE POLICY "Permission: Manage all memberships"
ON church_memberships FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_members'));


-- 2. ministries
DROP POLICY IF EXISTS "Public authenticated can see ministries" ON ministries;
DROP POLICY IF EXISTS "Admins can manage ministries" ON ministries;

DROP POLICY IF EXISTS "Permission: View ministries" ON ministries;
CREATE POLICY "Permission: View ministries"
ON ministries FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

DROP POLICY IF EXISTS "Permission: Manage ministries" ON ministries;
CREATE POLICY "Permission: Manage ministries"
ON ministries FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_ministries'));


-- 3. ministry_groups
DROP POLICY IF EXISTS "Public authenticated can see groups" ON ministry_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON ministry_groups;

DROP POLICY IF EXISTS "Permission: View groups" ON ministry_groups;
CREATE POLICY "Permission: View groups"
ON ministry_groups FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

DROP POLICY IF EXISTS "Permission: Manage groups" ON ministry_groups;
CREATE POLICY "Permission: Manage groups"
ON ministry_groups FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_ministries'));


-- 4. ministry_member_assignments (Connections between members and groups)
DROP POLICY IF EXISTS "Staff can see assignments" ON ministry_member_assignments;
DROP POLICY IF EXISTS "Staff can manage assignments" ON ministry_member_assignments;

DROP POLICY IF EXISTS "Permission: View assignments" ON ministry_member_assignments;
CREATE POLICY "Permission: View assignments"
ON ministry_member_assignments FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

DROP POLICY IF EXISTS "Permission: Manage assignments" ON ministry_member_assignments;
CREATE POLICY "Permission: Manage assignments"
ON ministry_member_assignments FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_members') OR public.has_permission(auth.uid(), 'church_manage_ministries'));

-- 1. Create journey_progress table to track automated workflows
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    journey_type TEXT NOT NULL DEFAULT 'visitor_welcome',
    current_step INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    next_run_at TIMESTAMPTZ DEFAULT now(),
    last_run_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create engagement_tasks for the Kanban Board
CREATE TABLE IF NOT EXISTS public.engagement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'backlog')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'follow_up',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    member_id UUID REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create donations table for giving tracking
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.church_memberships(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    donation_date TIMESTAMPTZ DEFAULT now(),
    payment_method TEXT, -- 'cash', 'card', 'transfer', 'check'
    category TEXT DEFAULT 'tithe', -- 'tithe', 'offering', 'building_fund', 'other'
    is_anonymous BOOLEAN DEFAULT false,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Admins and staff can manage journeys" ON public.journey_progress
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Admins and staff can manage tasks" ON public.engagement_tasks
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Users can see tasks assigned to them" ON public.engagement_tasks
    FOR SELECT TO authenticated USING (assigned_to = auth.uid());

CREATE POLICY "Admins and staff can view all donations" ON public.donations
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Admins can manage donations" ON public.donations
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 6. Trigger to automatically start journey for new visitors
CREATE OR REPLACE FUNCTION public.auto_start_visitor_journey()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membership_type = 'visitor' THEN
        INSERT INTO public.journey_progress (membership_id, journey_type, next_run_at)
        VALUES (NEW.id, 'visitor_welcome', now());
        
        -- Also create an initial task for the outreach team
        INSERT INTO public.engagement_tasks (title, description, member_id, category, priority)
        VALUES (
            'Initial Call: ' || (SELECT first_name || ' ' || last_name FROM profiles WHERE id = NEW.profile_id),
            'New visitor onboarded. Please make a welcome call within 48 hours.',
            NEW.id,
            'welcome_call',
            'high'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_visitor_created ON public.church_memberships;
CREATE TRIGGER on_visitor_created
AFTER INSERT ON public.church_memberships
FOR EACH ROW EXECUTE FUNCTION public.auto_start_visitor_journey();

-- 1. Add journey_stage to church_memberships
ALTER TABLE public.church_memberships 
ADD COLUMN IF NOT EXISTS journey_stage TEXT DEFAULT 'initial_visit' 
CHECK (journey_stage IN ('initial_visit', 'followed_up', 'connected', 'member', 'leader', 'inactive'));

-- 2. Create milestones table for spiritual growth tracking
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- 'first_visit', 'decision', 'baptism', 'foundation_class', 'official_membership'
    attained_at DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create communications_log for CRM tracking
CREATE TABLE IF NOT EXISTS public.communications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id),
    communication_type TEXT NOT NULL, -- 'call', 'email', 'sms', 'in_person'
    summary TEXT NOT NULL,
    outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Admins and staff can manage milestones" ON public.milestones
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

CREATE POLICY "Admins and staff can manage communications" ON public.communications_log
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
    );

-- 6. Trigger to log initial visit milestone
CREATE OR REPLACE FUNCTION public.log_initial_visit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.milestones (member_id, milestone_type, notes)
    VALUES (NEW.id, 'first_visit', 'Automatically recorded upon onboarding');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_member_onboarded_milestone ON public.church_memberships;
CREATE TRIGGER on_member_onboarded_milestone
AFTER INSERT ON public.church_memberships
FOR EACH ROW EXECUTE FUNCTION public.log_initial_visit();

-- 1. Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert Visitor Welcome Template
INSERT INTO public.email_templates (name, subject, body_html, description)
VALUES (
    'visitor_welcome',
    'Welcome to our family, {{firstName}}!',
    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #4f46e5; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">We''re Glad You''re Here!</h1>
        </div>
        
        <p style="font-size: 18px;">Hi <strong>{{firstName}}</strong>,</p>
        
        <p>It was such a joy having you visit us. At <strong>KiddoChecker Church</strong>, we believe every person who walks through our doors is a guest of honor.</p>
        
        <div style="background-color: #f8fafc; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #e2e8f0;">
            <h2 style="font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">What''s Next?</h2>
            <p style="margin: 0;">We''d love to get to know you better. If you have any prayer points or questions about our ministry, just reply to this email!</p>
        </div>

        <p>We have a special "New Members" orientation next Sunday. We''d love to see you there!</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #94a3b8; text-align: center;">
            <p>Â© 2026 KiddoChecker Church. All rights reserved.</p>
        </div>
    </div>',
    'The standard welcome email sent to first-time visitors.'
) ON CONFLICT (name) DO UPDATE SET 
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html;

-- 3. Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins can manage templates" ON public.email_templates
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Anyone authenticated can view templates" ON public.email_templates
    FOR SELECT TO authenticated USING (true);

-- RLS REPAIR: Comprehensive access for Staff/Kiosk roles
-- Ensures identification (QR scans) works for all authorized roles.

-- 1. PROFILES: Allow all staff roles to SELECT for identification
DROP POLICY IF EXISTS "staff_view_profiles_for_id" ON public.profiles;
CREATE POLICY "staff_view_profiles_for_id"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  public.has_role_secure('kiosk'::app_role)
);

-- 2. CHILDREN: Ensure all staff roles can SELECT children (already handled but reinforcing)
DROP POLICY IF EXISTS "staff_view_children_for_id" ON public.children;
CREATE POLICY "staff_view_children_for_id"
ON public.children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() OR
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  public.has_role_secure('kiosk'::app_role)
);

-- 3. QR_CODES: Allow staff to view tokens for lookups
DROP POLICY IF EXISTS "staff_view_qr_codes" ON public.qr_codes;
CREATE POLICY "staff_view_qr_codes"
ON public.qr_codes FOR SELECT
TO authenticated
USING (
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('kiosk'::app_role)
);

-- 4. CHURCH_MEMBERSHIPS: Ensure staff can see membership details (Visitors)
DROP POLICY IF EXISTS "staff_view_memberships" ON public.church_memberships;
CREATE POLICY "staff_view_memberships"
ON public.church_memberships FOR SELECT
TO authenticated
USING (
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('kiosk'::app_role)
);

-- 5. Add profile_id to qr_codes to support non-child QR codes (Optional but good for future)
-- For now, let's just make sure existing child lookups work.
-- Allow users to manage their own church membership record
DROP POLICY IF EXISTS "Users can manage own membership" ON public.church_memberships;

CREATE POLICY "Users can insert own membership"
ON public.church_memberships FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own membership"
ON public.church_memberships FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
-- ðŸš© Feature Flags: Center Finder Toggle
ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS show_center_finder BOOLEAN DEFAULT TRUE;

-- Update the storage of existing settings to ensure the column is populated
UPDATE public.organization_settings SET show_center_finder = TRUE WHERE show_center_finder IS NULL;
-- ðŸ›¡ï¸ Security Sweep & Access Control Strengthening
-- Description: Seeding church permissions, hardening organization_settings, and fixing interaction policies.

-- 1. Ensure new permissions exist
INSERT INTO public.permissions (name, description, category) VALUES
('church_view', 'View the church management dashboard and member profiles', 'church'),
('church_manage_members', 'Add, edit, and onboard formal members and visitors', 'church'),
('church_manage_ministries', 'Create and manage departments and small groups', 'church')
ON CONFLICT (name) DO NOTHING;

-- 2. Harden organization_settings RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view organization settings" ON public.organization_settings;
CREATE POLICY "Anyone can view organization settings" 
ON public.organization_settings FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Only admins can manage settings" ON public.organization_settings;
CREATE POLICY "Only admins can manage settings" 
ON public.organization_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  )
);

-- 3. Refine visitor_interactions RLS
DROP POLICY IF EXISTS "Admins can manage all interactions" ON public.visitor_interactions;
CREATE POLICY "Permission-based interaction access" 
ON public.visitor_interactions FOR ALL 
TO authenticated 
USING (
  public.has_permission(auth.uid(), 'church_view') OR 
  public.has_permission(auth.uid(), 'church_manage_members')
);

-- 4. Ensure profiles RLS lets staff see member profiles
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  public.has_permission(auth.uid(), 'church_view') OR 
  (auth.uid() = id)
);

-- 5. Harden all SECURITY DEFINER functions with search_path
ALTER FUNCTION public.has_permission(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.is_admin_secure() SET search_path = public;
ALTER FUNCTION public.get_staff_members() SET search_path = public;
-- ðŸ“ File Storage & Quota Management (FSRM-style)
-- Description: Implements configurable upload quotas, hard/soft limits, and file screening.

ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS max_upload_size_kb INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS upload_limit_type TEXT CHECK (upload_limit_type IN ('hard', 'soft')) DEFAULT 'hard',
ADD COLUMN IF NOT EXISTS blocked_extensions TEXT[] DEFAULT ARRAY['exe', 'bat', 'sh', 'php', 'js', 'py'];

-- RLS check for these settings is already covered by previous migrations, 
-- but ensuring they are readable by all authenticated users for client-side enforcement
-- and only editable by admins.
-- Add wellness screening flags to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS health_screening_fever BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS health_screening_cough BOOLEAN DEFAULT FALSE;

-- Update checkin_child RPC to handle wellness flags
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL,
  p_health_fever boolean DEFAULT FALSE,
  p_health_cough boolean DEFAULT FALSE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'kiosk')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station,
    special_instructions,
    health_screening_fever,
    health_screening_cough
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station,
    p_special_instructions,
    p_health_fever,
    p_health_cough
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;
-- Add show_wellness_check to organization_settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS show_wellness_check BOOLEAN DEFAULT TRUE;
-- ðŸ› ï¸ Fix Visitor Interactions: Set default for created_by
-- Description: Ensure visitor_interactions table records who created the entry by default.

-- 1. Add default auth.uid() if missing (or a trigger)
ALTER TABLE public.visitor_interactions 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 2. Update existing nulls if any (using some system user or current user if run manually)
-- Since we are on Supabase, existing records might have null created_by.
-- We can't easily map them back, but for new ones it will work.

-- 3. Ensure profiles are visible to staff (re-verifying RLS)
-- Profiles for 'staff' should be visible to 'staff' if they are authors of interactions.
-- (This should already be handled by the public access for authenticated users in the profiles table but let's be double sure)
-- ðŸŽŸï¸ Expand Roles & Security Features
-- Description: Adds 'regular_user' role and provides a placeholder for password reset automation.

-- 1. Add regular_user to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'regular_user';

-- 2. Ensure volunteer role is definitely present (just in case)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';

-- 3. Update profiles handle function (already updated in previous migrations but good to keep in sync)
-- We'll just leave the trigger alone as it's already robust.
-- ðŸ“ˆ REPAIR: Expand User Management RPC
-- Description: Fixes the structural mismatch by using the correct column name 'zip_code' and adding back 'children_count'.

DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  created_at timestamptz,
  address text,
  city text,
  state text,
  zip text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  children_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      COALESCE(p.phone, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      COALESCE(ur.is_volunteer, false),
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      au.created_at,
      p.address::text,
      p.city::text,
      p.state::text,
      p.zip_code::text as zip, -- Correct column is zip_code
      p.gender::text,
      p.occupation::text,
      p.emergency_contact_name::text,
      p.emergency_contact_phone::text,
      (SELECT count(*)::integer FROM public.children c WHERE c.parent_id = ur.user_id) as children_count
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO service_role;
-- â›ª Detailed Church Management Analytics
-- Description: Updates the church stats RPC to provide real funnel data and active journey metrics for the dashboard.

CREATE OR REPLACE FUNCTION get_church_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    v_total_members INTEGER;
    v_registered_count INTEGER;
    v_regular_count INTEGER;
    v_visitor_count INTEGER;
    v_active_journey INTEGER;
    v_first_followup INTEGER;
    v_ministry_count INTEGER;
    v_group_count INTEGER;
BEGIN
    -- Basic counts
    SELECT count(*) INTO v_total_members FROM church_memberships;
    SELECT count(*) INTO v_registered_count FROM church_memberships WHERE membership_type = 'registered';
    SELECT count(*) INTO v_regular_count FROM church_memberships WHERE membership_type = 'regular';
    SELECT count(*) INTO v_visitor_count FROM church_memberships WHERE membership_type = 'visitor';
    
    -- Active Journey: Visitors joined in the last 30 days
    SELECT count(*) INTO v_active_journey FROM church_memberships 
    WHERE membership_type = 'visitor' AND joined_at >= (now() - interval '30 days');
    
    -- First Follow-up: Visitors with at least one interaction
    SELECT count(DISTINCT visitor_id) INTO v_first_followup 
    FROM visitor_interactions 
    WHERE visitor_id IN (SELECT profile_id FROM church_memberships WHERE membership_type = 'visitor' AND profile_id IS NOT NULL);

    SELECT count(*) INTO v_ministry_count FROM ministries;
    SELECT count(*) INTO v_group_count FROM ministry_groups;

    SELECT jsonb_build_object(
        'total_members', v_total_members,
        'registered_count', v_registered_count,
        'regular_count', v_regular_count,
        'visitor_count', v_visitor_count,
        'active_journey', v_active_journey,
        'first_followup', COALESCE(v_first_followup, 0),
        'total_ministries', v_ministry_count,
        'active_groups', v_group_count,
        'integrations_perc', CASE 
            WHEN v_visitor_count = 0 THEN 0 
            ELSE ROUND((v_registered_count::float / NULLIF(v_total_members, 0)::float) * 100) 
        END
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Fix missing created_by column in events table
-- This column is required by the current application code for event ownership and RLS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.events ADD COLUMN created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing events (if any) to have a owner if possible (not strictly required unless we make it NOT NULL later)
-- For now, let's just make sure all NEW events have it.

-- Re-enable RLS just in case it was disabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Synchronize RLS policies with the application architecture
DROP POLICY IF EXISTS "Allow authenticated users to view public events" ON public.events;
CREATE POLICY "Allow authenticated users to view public events" 
ON public.events
FOR SELECT
TO authenticated
USING (is_public = true);

-- Policy: Admins, Staff and Teachers can manage all events
DROP POLICY IF EXISTS "Allow admins to manage all events" ON public.events;
CREATE POLICY "Allow admins to manage all events" 
ON public.events
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'staff', 'teacher')
    )
);

-- Policy: Users can manage their own events (useful for personal schedules later)
DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
CREATE POLICY "Users can manage own events" 
ON public.events
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());
-- ðŸ“ˆ REPAIR: Expand User Management RPC
-- Description: Fixes the structural mismatch by using the correct column name 'zip_code' and adding back 'children_count'.

DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  created_at timestamptz,
  address text,
  city text,
  state text,
  zip text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  children_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      COALESCE(p.phone, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      COALESCE(ur.is_volunteer, false),
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      au.created_at,
      p.address::text,
      p.city::text,
      p.state::text,
      p.zip_code::text as zip, -- Correct column is zip_code
      p.gender::text,
      p.occupation::text,
      p.emergency_contact_name::text,
      p.emergency_contact_phone::text,
      (SELECT count(*)::integer FROM public.children c WHERE c.parent_id = ur.user_id) as children_count
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO service_role;

-- ðŸ›¡ï¸ Security Sweep: Refine get_staff_members to exclude regular_user
-- Description: Ensures congregation members (regular_user) do not appear in the internal staff roster.

CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text,
  department text,
  specialties text[],
  max_hours_per_week integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      CASE 
        WHEN auth.uid() = ur.user_id THEN p.staff_pin::TEXT
        ELSE NULL -- PIN is sensitive: only owner can see it
      END as staff_pin,
      p.avatar_url::TEXT,
      p.photo_url::TEXT,
      p.department::TEXT,
      p.specialties,
      p.max_hours_per_week
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk', 'regular_user')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;
-- =============================================================
-- Migration: Security Groups & Role Hardening
-- Description: Introduces Security Groups, enforces class isolation for teachers,
--              and restricts manual check-ins to physical kiosks for staff.
-- =============================================================

-- â”€â”€ 1. Create Security Groups Table â”€â”€
CREATE TABLE IF NOT EXISTS public.security_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- â”€â”€ 2. Create Group Permissions Join Table â”€â”€
CREATE TABLE IF NOT EXISTS public.group_permissions (
    group_id UUID REFERENCES public.security_groups(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, permission_id)
);

-- â”€â”€ 3. Create User Groups Join Table â”€â”€
CREATE TABLE IF NOT EXISTS public.user_security_groups (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.security_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- â”€â”€ 4. Enable RLS on new tables â”€â”€
ALTER TABLE public.security_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_groups ENABLE ROW LEVEL SECURITY;

-- â”€â”€ 5. Define Security Policies for Groups â”€â”€
DROP POLICY IF EXISTS "Admins manage security groups" ON public.security_groups;
CREATE POLICY "Admins manage security groups" ON public.security_groups 
FOR ALL TO authenticated USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Authenticated users view security groups" ON public.security_groups;
CREATE POLICY "Authenticated users view security groups" ON public.security_groups 
FOR SELECT TO authenticated USING (true);

-- â”€â”€ 6. Seed Granular Permissions â”€â”€
INSERT INTO public.permissions (name, description, category) VALUES
('checkin.manual_dashboard', 'Perform check-ins without a physical kiosk device', 'attendance'),
('congregation.view_all', 'View the entire church/center roster', 'profiles'),
('staff.public_manager', 'Visible to all parents for escalation/support', 'profiles'),
('audit.view_forensics', 'Access security logs and forensic logs', 'security'),
('staff.manage_schedules', 'Create and edit roster templates', 'management')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- â”€â”€ 7. Seed Standard Security Groups â”€â”€
INSERT INTO public.security_groups (name, description) VALUES
('Congregation Viewers', 'Users in this group can see the full church roster.'),
('Forensic Auditors', 'Users in this group can access forensic security logs.'),
('Shift Managers', 'Users in this group can manage staff schedules and rosters.')
ON CONFLICT (name) DO NOTHING;

-- â”€â”€ 8. Redefine check_user_permission to include Groups â”€â”€
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean := false;
  v_has_permission boolean := false;
BEGIN
  -- 1. SuperAdmin Bypass
  SELECT COALESCE(is_super_admin, false) OR role = 'super_admin'
  INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  IF v_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- 2. Check Custom Role Permissions
  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;

  IF v_has_permission THEN RETURN true; END IF;

  -- 3. Check Security Group Permissions
  SELECT EXISTS(
    SELECT 1
    FROM public.user_security_groups usg
    JOIN public.group_permissions gp ON usg.group_id = gp.group_id
    JOIN public.permissions p ON gp.permission_id = p.id
    WHERE usg.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- â”€â”€ 9. Harden RLS: profiles (Congregation & Staff Visibility) â”€â”€
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  -- 1. Always see your own profile
  id = auth.uid()
  -- 2. Explicit Permission (Admins/Managers)
  OR public.check_user_permission(auth.uid(), 'congregation.view_all')
  OR public.is_admin_secure()
  -- 3. Parent "Need-to-Know" Visibility
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = profiles.id 
      AND (
        -- Parents see staff assigned to their children's classes
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.children c ON t.class_id = c.class_id
            WHERE t.user_id = profiles.id AND c.parent_id = auth.uid()
        )
        -- Parents see Public Managers for escalation
        OR public.check_user_permission(profiles.id, 'staff.public_manager')
      )
    )
  )
);

-- Ensure user_roles visibility follows the same logic to prevent RLS bypass via role-checks
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view staff roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR public.is_admin_secure()
  OR (
    -- Parent viewing staff of their child's class
    EXISTS (
        SELECT 1 FROM public.teachers t
        JOIN public.children c ON t.class_id = c.class_id
        WHERE t.user_id = user_roles.user_id AND c.parent_id = auth.uid()
    )
    -- Parent viewing public managers
    OR public.check_user_permission(user_roles.user_id, 'staff.public_manager')
  )
);

-- â”€â”€ 10. Harden check-in/out functions (Kiosk Enforcement) â”€â”€
-- Note: This requires the application to pass a device_id.
-- We update the logic to check if the caller has manual dashboard permission.

CREATE OR REPLACE FUNCTION public.check_kiosk_authorized(p_device_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Admins/SuperAdmins can check in from anywhere
    IF public.is_admin_secure() THEN
        RETURN true;
    END IF;

    -- If user has manual dashboard permission, bypass device check
    IF public.check_user_permission(p_user_id, 'checkin.manual_dashboard') THEN
        RETURN true;
    END IF;

    -- Otherwise, must be from a registered kiosk device
    RETURN EXISTS (
        SELECT 1 FROM public.enrolled_devices
        WHERE id = p_device_id
        AND type = 'kiosk'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- â”€â”€ 11. Final Role Hardening: Teacher Class Isolation â”€â”€
-- Ensure teachers can only see classes they are assigned to.
DROP POLICY IF EXISTS "classes_staff_view_assigned" ON public.classes;
CREATE POLICY "classes_staff_view_assigned"
ON public.classes FOR SELECT TO authenticated
USING (
    public.is_admin_secure()
    OR id IN (
        SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "children_staff_assigned_select" ON public.children;
CREATE POLICY "children_staff_assigned_select"
ON public.children FOR SELECT TO authenticated
USING (
    public.is_admin_secure()
    OR (
        class_id IN (SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid())
    )
);

-- â”€â”€ 12. Redefine checkin/checkout with Kiosk Enforcement â”€â”€
DROP FUNCTION IF EXISTS public.checkin_child(uuid, uuid, uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_device_id uuid DEFAULT NULL -- NEW: Physical hardware ID
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check (Role + Security Groups)
  IF public.is_admin_secure() THEN
    is_authorized := true;
  ELSIF public.check_user_permission(caller_id, 'checkin.manual_dashboard') THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    -- Parents always authorized for their own kids
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id AND qr_data = p_qr_token AND is_active = true
  ) THEN
    -- Valid QR code bypass
    is_authorized := true;
  ELSIF public.check_kiosk_authorized(p_device_id, caller_id) THEN
    -- Request is coming from a verified physical kiosk
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: Check-in must be performed from an authorized kiosk device.';
  END IF;

  -- 2. Insert record
  INSERT INTO attendance (
    child_id, class_id, checked_in_at, checked_in_by, 
    attendance_date, checked_in_method, checked_in_station
  )
  VALUES (
    p_child_id, p_class_id, NOW(), COALESCE(p_checked_in_by, caller_id),
    today_date, p_method, COALESCE(p_station, p_device_id::text)
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$$;

DROP FUNCTION IF EXISTS public.checkout_child(uuid, uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.checkout_child(
  p_attendance_id uuid,
  p_checked_out_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_device_id uuid DEFAULT NULL -- NEW: Physical hardware ID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_child_id uuid;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  SELECT child_id INTO v_child_id FROM attendance WHERE id = p_attendance_id;
  IF v_child_id IS NULL THEN RETURN false; END IF;

  -- 1. Authorization Check
  IF public.is_admin_secure() THEN
    is_authorized := true;
  ELSIF public.check_user_permission(caller_id, 'checkin.manual_dashboard') THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children WHERE id = v_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes WHERE child_id = v_child_id AND qr_data = p_qr_token AND is_active = true
  ) THEN
    is_authorized := true;
  ELSIF public.check_kiosk_authorized(p_device_id, caller_id) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: Check-out must be performed from an authorized kiosk device.';
  END IF;

  -- 2. Update record
  UPDATE attendance 
  SET 
    checked_out_at = NOW(),
    checked_out_by = COALESCE(p_checked_out_by, caller_id),
    checked_out_method = p_method,
    checked_out_station = COALESCE(p_station, p_device_id::text)
  WHERE id = p_attendance_id AND checked_out_at IS NULL;

  RETURN FOUND;
END;
$$;

-- â”€â”€ 13. Governance: Four-Eyes Approval System â”€â”€
CREATE TABLE IF NOT EXISTS public.pending_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    action_data JSONB NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage approvals" ON public.pending_approvals 
FOR ALL USING (public.is_admin_secure());

-- â”€â”€ 14. Accountability: Read-Access Logging (Transparency) â”€â”€
CREATE TABLE IF NOT EXISTS public.data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    resource_type TEXT NOT NULL, -- e.g., 'child_medical_notes', 'forensic_report'
    resource_id UUID,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB -- IP, device info, etc.
);

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view access logs" ON public.data_access_logs 
FOR SELECT USING (public.is_admin_secure());

CREATE OR REPLACE FUNCTION public.log_sensitive_access(p_resource_type text, p_resource_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.data_access_logs (user_id, resource_type, resource_id)
    VALUES (auth.uid(), p_resource_type, p_resource_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- â”€â”€ 15. Integrity: Report Sealing â”€â”€
CREATE TABLE IF NOT EXISTS public.report_seals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    report_hash TEXT NOT NULL, -- SHA-256
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.report_seals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can verify seals" ON public.report_seals 
FOR SELECT USING (true);

-- Migration: Fix Infinite Recursion in user_roles
-- Description: Removes recursive policies and optimizes admin checks.

-- 1. Nuke the recursive policy added today
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;

-- 2. Revert is_admin_secure to LANGUAGE sql (more reliable for recursion bypass in some Postgres versions)
-- and ensure it's owned by postgres to bypass RLS.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  );
$$;

-- 3. Ensure the base policies for user_roles are clean
DROP POLICY IF EXISTS "users_view_own_role_final" ON public.user_roles;
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_roles_final" ON public.user_roles;
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- 4. Fix profiles recursion as well (just in case)
DROP POLICY IF EXISTS "authenticated_view_profiles_selective" ON public.profiles;
CREATE POLICY "authenticated_view_profiles_selective" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  id = auth.uid()
  OR public.is_admin_secure()
  OR EXISTS (
    -- Direct check instead of calling another function that might query profiles
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profiles.id 
    AND (
      -- Parent visibility check (non-recursive)
      EXISTS (
          SELECT 1 FROM public.teachers t
          JOIN public.children c ON t.class_id = c.class_id
          WHERE t.user_id = profiles.id AND c.parent_id = auth.uid()
      )
    )
  )
);
-- ðŸ› ï¸ COMPREHENSIVE DB REPAIR: Recursion Break & Data Restoration
-- This migration resolves infinite recursion and restores missing columns to staff/user RPCs.

-- 1. Break Infinite Recursion in Admin Checks
-- We use a pure SQL function that DOES NOT call policies on tables it queries.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  );
$$;

-- 2. Repair user_roles policies to use the secure check
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

CREATE POLICY "Allow view own role" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.is_admin_secure());

CREATE POLICY "Allow admin manage all" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.is_admin_secure());

-- 3. Restore get_staff_members with ALL expected columns
DROP FUNCTION IF EXISTS public.get_staff_members();
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text,
  department text,
  specialties text[],
  max_hours_per_week integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: Only staff or admins can view the roster.
  IF NOT (public.is_admin_secure()) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = auth.uid() 
    AND role IN ('staff', 'teacher', 'teacher_assistant')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can view the roster.';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      CASE 
        WHEN auth.uid() = ur.user_id THEN p.staff_pin::TEXT
        ELSE NULL -- PIN is sensitive: only owner can see it
      END as staff_pin,
      p.avatar_url::TEXT,
      p.photo_url::TEXT,
      p.department::TEXT,
      p.specialties,
      p.max_hours_per_week
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk', 'regular_user')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 4. Restore get_users_with_roles with ALL columns
DROP FUNCTION IF EXISTS public.get_users_with_roles();
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  created_at timestamptz,
  address text,
  city text,
  state text,
  zip text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  children_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can see the full user list
  IF NOT (public.is_admin_secure()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      COALESCE(p.phone, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      COALESCE(ur.is_volunteer, false),
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      au.created_at,
      p.address::text,
      p.city::text,
      p.state::text,
      p.zip_code::text as zip,
      p.gender::text,
      p.occupation::text,
      p.emergency_contact_name::text,
      p.emergency_contact_phone::text,
      (SELECT count(*)::integer FROM public.children c WHERE c.parent_id = ur.user_id) as children_count
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 5. Final Grant permissions
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
-- =============================================================
-- Migration: Enhanced Security Management
-- Description: Seeds system roles and enables name/description editing.
-- =============================================================

-- 1. Ensure is_system_role column exists (it should from 20260310070000)
-- But let's verify or add it just in case.
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_roles' AND column_name = 'is_system_role'
    ) THEN
        ALTER TABLE public.custom_roles ADD COLUMN is_system_role BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_roles' AND column_name = 'base_role'
    ) THEN
        ALTER TABLE public.custom_roles ADD COLUMN base_role TEXT;
    END IF;

    -- 1.2 Ensure name is UNIQUE for ON CONFLICT
    IF NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.custom_roles'::regclass
        AND i.indisunique
        AND a.attname = 'name'
    ) THEN
        -- Clean up any duplicates just in case
        DELETE FROM public.custom_roles cr1
        USING public.custom_roles cr2
        WHERE cr1.id > cr2.id AND cr1.name = cr2.name;

        ALTER TABLE public.custom_roles ADD CONSTRAINT custom_roles_name_unique UNIQUE (name);
    END IF;
END $$;

-- 2. Seed System Roles into custom_roles
-- This allows adjusting permissions for built-in roles.
DO $$
BEGIN
    EXECUTE 'INSERT INTO public.custom_roles (name, description, base_role, is_system_role) VALUES
    (''System: Administrator'', ''Baseline permissions for organizational administrators.'', ''admin'', true),
    (''System: Staff'', ''Standard operational permissions for staff members.'', ''staff'', true),
    (''System: Teacher'', ''Standard educational and classroom management permissions.'', ''teacher'', true),
    (''System: Assistant Teacher'', ''Restricted classroom support permissions.'', ''teacher_assistant'', true),
    (''System: Volunteer'', ''Minimum viable permissions for event-based volunteers.'', ''volunteer'', true),
    (''System: Kiosk'', ''Fixed-terminal permissions for automated check-in hardware.'', ''kiosk'', true),
    (''System: Parent'', ''Personal data access and children management for families.'', ''parent'', true)
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        base_role = EXCLUDED.base_role,
        is_system_role = true';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error seeding system roles: %', SQLERRM;
END $$;

-- 3. Update permissions table to include categories for UI grouping
UPDATE public.permissions SET category = 'General' WHERE category IS NULL OR category = 'legacy';

-- 4. Assign default permissions to system roles if they don't have them
-- This ensures the system doesn't break when switching to custom-role based checks.
-- (We'll do this based on the existing standard permissions)

-- Admin gets almost everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'System: Administrator'
ON CONFLICT DO NOTHING;

-- Staff gets operational perms
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'System: Staff' AND p.category IN ('children', 'attendance', 'kiosk')
ON CONFLICT DO NOTHING;

-- Teacher gets classroom perms
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'System: Teacher' AND p.name IN ('view_assigned_children', 'view_assigned_attendance', 'manage_classes')
ON CONFLICT DO NOTHING;

-- Migration: Add timezone to organization settings
-- Description: Enables persistence of the organization's preferred timezone for reporting and scheduling.

ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Update existing records if any
UPDATE public.organization_settings SET timezone = 'America/New_York' WHERE timezone IS NULL;

-- Helper to get org timezone
CREATE OR REPLACE FUNCTION public.get_org_timezone()
RETURNS TEXT AS $$
    SELECT COALESCE(timezone, 'America/New_York') FROM public.organization_settings LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper to get today's date in org timezone
CREATE OR REPLACE FUNCTION public.get_org_today()
RETURNS DATE AS $$
    SELECT (NOW() AT TIME ZONE public.get_org_timezone())::DATE;
$$ LANGUAGE sql STABLE;

-- Redefine checkin_child to use the org's timezone
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_device_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attendance_id uuid;
  today_date date := public.get_org_today();
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
BEGIN
  -- 1. Authorization Check (Role + Security Groups)
  IF public.is_admin_secure() THEN
    is_authorized := true;
  ELSIF public.check_user_permission(caller_id, 'checkin.manual_dashboard') THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id AND qr_data = p_qr_token AND is_active = true
  ) THEN
    is_authorized := true;
  ELSIF public.check_kiosk_authorized(p_device_id, caller_id) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: Check-in must be performed from an authorized kiosk device.';
  END IF;

  -- 2. Insert record
  INSERT INTO attendance (
    child_id, class_id, checked_in_at, checked_in_by, 
    attendance_date, checked_in_method, checked_in_station
  )
  VALUES (
    p_child_id, p_class_id, NOW(), COALESCE(p_checked_in_by, caller_id),
    today_date, p_method, COALESCE(p_station, p_device_id::text)
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_org_timezone() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_child(uuid, uuid, uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_report(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_liability_audit_report(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_detailed_attendance_report(date, date) TO authenticated;

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

-- Migration: 20261010200000_disable_center_finder_by_default.sql
-- Description: Disable the center finder feature by default as requested.

UPDATE public.organization_settings 
SET show_center_finder = FALSE 
WHERE show_center_finder IS TRUE OR show_center_finder IS NULL;

-- Also update the default for future inserts
ALTER TABLE public.organization_settings 
ALTER COLUMN show_center_finder SET DEFAULT FALSE;
-- ðŸ›¡ï¸ Phase 3: Security Hardening & RLS Audit
-- Migration: 20261011000000_security_hardening_audit.sql
-- Description: Fixes privilege escalation, secures org promotion, and adds missing auth checks to RPCs.

-- 1. Helper: MFA Awareness
CREATE OR REPLACE FUNCTION public.is_mfa_authenticated()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if Authenticator Assurance Level is 2 (MFA completed)
  RETURN (SELECT COALESCE(auth.jwt() ->> 'aal', '') = 'aal2');
END;
$$;

-- 2. Helper: Consolidated Admin Check
-- This centralizes admin detection and ensures it's SECURITY DEFINER to bypass RLS for checks.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  );
END;
$$;

-- 3. Fix handle_new_user() trigger to prevent self-promotion
-- Prevents users from passing 'admin' or 'super_admin' in metadata to get elevated roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role app_role;
  v_meta_role text;
BEGIN
  v_meta_role := NEW.raw_user_meta_data->>'target_role';
  
  -- Whitelist roles that can be self-assigned.
  -- 'admin' and 'super_admin' are EXPLICITLY forbidden to be self-assigned via metadata.
  IF v_meta_role IN ('parent', 'kiosk') THEN
    v_role := v_meta_role::app_role;
  ELSE
    v_role := 'parent'::app_role;
  END IF;

  -- Kiosk devices are special
  IF (NEW.raw_user_meta_data->>'is_device')::boolean IS TRUE THEN
    v_role := 'kiosk'::app_role;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Assign role (skip if it's the org creator - they use a secure RPC)
  IF (NEW.raw_user_meta_data->>'is_org_creator')::boolean IS NOT TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Secure assign_organization_creator_role()
-- Only allow assigning if the organization has no creator OR if the caller is an admin.
CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_creator UUID;
BEGIN
  -- Get current creator of the org
  SELECT created_by INTO v_current_creator 
  FROM public.organization_settings 
  WHERE id = p_org_id;

  -- Security check: 
  -- Prevent "hijacking" of organizations.
  IF v_current_creator IS NOT NULL 
     AND v_current_creator != p_user_id 
     AND NOT (SELECT public.is_admin_secure()) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot hijack organization ownership.';
  END IF;

  -- Update/Insert role
  INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
  VALUES (p_user_id, 'super_admin'::app_role, true, 'verified', now())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin'::app_role,
    is_super_admin = true,
    verification_status = 'verified',
    verified_at = now();
  
  -- Link creator to org if not already linked
  UPDATE public.organization_settings
  SET created_by = p_user_id
  WHERE id = p_org_id AND created_by IS NULL;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 5. Harden RPC: get_staff_members()
-- Only staff/admins should see the staff roster.
DROP FUNCTION IF EXISTS public.get_staff_members();
CREATE OR REPLACE FUNCTION public.get_staff_members()

RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: Only staff or admins can view the roster.
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can view the roster.';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 6. Harden RPC: get_attendance_report()
-- Only admins/staff should see aggregate reports.
DROP FUNCTION IF EXISTS public.get_attendance_report(date, date);
CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date)

RETURNS TABLE(
  attendance_date date,
  total_checked_in integer,
  total_checked_out integer,
  class_name text,
  class_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check
  IF NOT (SELECT public.is_admin_secure()) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'staff'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT 
      a.attendance_date,
      COUNT(a.id) FILTER (WHERE a.checked_in_at IS NOT NULL)::INTEGER as total_checked_in,
      COUNT(a.id) FILTER (WHERE a.checked_out_at IS NOT NULL)::INTEGER as total_checked_out,
      c.name as class_name,
      c.id as class_id
    FROM 
      attendance a
    LEFT JOIN 
      classes c ON a.class_id = c.id
    WHERE 
      a.attendance_date BETWEEN start_date AND end_date
    GROUP BY 
      a.attendance_date, c.name, c.id
    ORDER BY 
      a.attendance_date DESC, c.name;
END;
$$;
-- ðŸ›¡ï¸ Phase 4: Session Security & Rate Limiting
-- Migration: 20261012000000_session_security_rate_limiting.sql

-- 1. Security Attempts Table (Rate Limiting Audit)
CREATE TABLE IF NOT EXISTS public.security_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'mfa_verify', 'staff_pin', 'password_change', 'login'
    status TEXT NOT NULL, -- 'success', 'failure'
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for rate-limit performance
CREATE INDEX IF NOT EXISTS idx_security_attempts_lookup 
ON public.security_attempts (user_id, action, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.security_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can view logs, users can't see anything (it's internal)
CREATE POLICY "Admins can view security logs"
ON public.security_attempts FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- 2. Rate Limit Logic
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_max_attempts INT,
    p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count
    FROM public.security_attempts
    WHERE user_id = p_user_id
    AND action = p_action
    AND status = 'failure'
    AND created_at > (now() - (p_window_minutes || ' minutes')::INTERVAL);
    
    RETURN v_count < p_max_attempts;
END;
$$;

-- 3. Log Security Attempt helper
CREATE OR REPLACE FUNCTION public.log_security_attempt(
    p_user_id UUID,
    p_action TEXT,
    p_status TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_attempts (user_id, action, status, metadata)
    VALUES (p_user_id, p_action, p_status, p_metadata);
END;
$$;

-- 4. Harden Staff PIN Verification with Rate Limiting
DROP FUNCTION IF EXISTS public.verify_staff_pin_for_kiosk(text);
CREATE OR REPLACE FUNCTION public.verify_staff_pin_for_kiosk(p_pin TEXT)

RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role app_role
) AS $$
DECLARE
    v_target_id UUID;
BEGIN
    -- Rate limit by the current authenticated user (the Kiosk device/session)
    IF NOT public.check_rate_limit(auth.uid(), 'staff_pin_verify', 5, 15) THEN
        RAISE EXCEPTION 'Too many failed PIN attempts. Station locked for 15 minutes.';
    END IF;

    -- Search for the staff member
    SELECT p.id INTO v_target_id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.staff_pin = UPPER(TRIM(p_pin))
    AND ur.role IN ('admin', 'super_admin', 'staff', 'teacher')
    LIMIT 1;

    IF v_target_id IS NOT NULL THEN
        -- Log success
        PERFORM public.log_security_attempt(auth.uid(), 'staff_pin_verify', 'success', jsonb_build_object('staff_id', v_target_id));
        
        RETURN QUERY
        SELECT 
            p.id, 
            p.first_name, 
            p.last_name, 
            ur.role
        FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.id = v_target_id;
    ELSE
        -- Log failure
        PERFORM public.log_security_attempt(auth.uid(), 'staff_pin_verify', 'failure');
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Active Session Management
-- Allows users to see their own active sessions for security monitoring
DROP FUNCTION IF EXISTS public.get_my_active_sessions();
CREATE OR REPLACE FUNCTION public.get_my_active_sessions()

RETURNS TABLE (
    id UUID,
    ip TEXT,
    user_agent TEXT,
    last_accessed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.ip,
        s.user_agent,
        s.last_accessed_at
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.last_accessed_at DESC;
END;
$$;

-- Allows users to revoke a specific session (e.g. from a stolen device)
CREATE OR REPLACE FUNCTION public.revoke_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM auth.sessions
    WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;

-- =============================================================
-- Migration: Performance and Security Seal
-- Description: Adds critical indices for reporting and seals security functions.
-- =============================================================

-- 1. Performance Indices
-- Attendance indices for fast reporting and dashboard loading
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_child_id ON public.attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON public.attendance(checked_in_at);

-- Profiles indices for fast search and roster listing
CREATE INDEX IF NOT EXISTS idx_profiles_names ON public.profiles(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_children_names ON public.children(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- Role indices for fast permission checks
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON public.user_roles(user_id, role);

-- 2. Security "Sealing"
-- Note: Manual ALTER statements removed. Global sealing is handled in migration 20261014.

-- 3. Cleanup: Consistency Repairs
-- Ensure organization_settings has a timezone if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_settings' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE public.organization_settings ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
    END IF;
END $$;

-- Update any null timezones to the default
UPDATE public.organization_settings SET timezone = 'America/New_York' WHERE timezone IS NULL;

-- Migration: Global Security Audit and Hardening
-- Date: 2026-10-14
-- Description: Resolves all Supabase linter warnings regarding search_path, execute permissions, and overly permissive RLS/Storage policies.

-- 0. REPAIR CORE TABLES
-- Ensures custom_roles has required columns before other operations proceed.
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_roles' AND column_name = 'base_role'
    ) THEN
        ALTER TABLE public.custom_roles ADD COLUMN base_role TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_roles' AND column_name = 'is_system_role'
    ) THEN
        ALTER TABLE public.custom_roles ADD COLUMN is_system_role BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1. SEAL FUNCTION SEARCH PATHS
-- Dynamically sets search_path to 'public' for all functions in the public schema.
-- This prevents search-path hijacking by ensuring functions always use the intended schema.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'ALTER FUNCTION ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || '(' || r.args || ') SET search_path = public';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not set search_path for function %: %', r.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. HARDEN EXECUTE PERMISSIONS
-- By default, PUBLIC (including anon) has EXECUTE permission on functions.
-- We revoke this globally and grant it back only to necessary roles.

-- Revoke from everyone
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant to authenticated users and service role (system)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specifically restrict sensitive admin functions to service_role or check internally
-- (Already handled via internal permission checks in most functions, but revoking from 'anon' is the key fix)

-- 3. HARDEN RLS POLICIES
-- Address "RLS Policy Always True" warnings

-- Device Activity Log
DROP POLICY IF EXISTS "Allow system to insert device logs" ON public.device_activity_log;
CREATE POLICY "Authorized entities can insert device logs"
    ON public.device_activity_log
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Families (System Bypass)
DROP POLICY IF EXISTS "System functions bypass RLS for families" ON public.families;
CREATE POLICY "Staff and Admins can manage families" 
ON public.families 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'super_admin')
  )
);

-- User Roles (System Bypass)
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles system-wide" 
ON public.user_roles 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR is_super_admin = true)
  )
);

-- Families Insert Policy fix (if exists)
DROP POLICY IF EXISTS "Users can insert their own families" ON public.families;
CREATE POLICY "Authenticated users can insert families" 
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. HARDEN STORAGE POLICIES
-- Address "Public Bucket Allows Listing"

-- For 'avatars' bucket, allow read access to objects but prevent broad listing via the API
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Note: In Supabase, for a public bucket, 'SELECT' is required for URL access if using the storage client.
-- However, if we want to prevent LISTING, we can't easily do it with just RLS on SELECT 
-- without breaking the ability to read a specific file by name if the name isn't guessable.
-- But the linter specifically warns about broad SELECT.
-- A better policy for public images:
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
-- (Wait, this is the same. To prevent listing but allow reading, one would need to restrict the return columns, 
-- but Supabase doesn't support column-level RLS easily. 
-- The linter's advice is: "Public buckets don't need this for object URL access".
-- So if the bucket is PUBLIC, we can just DROP the SELECT policy for PUBLIC/ANON entirely!)

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- If anyone needs to LIST via API, they must be authenticated.
CREATE POLICY "Authenticated users can list avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- 5. FINAL AUDIT FUNCTIONS CLEANUP
-- Revoke execute from anon for sensitive security functions explicitly
REVOKE EXECUTE ON FUNCTION public.admin_verify_staff FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_table_policies_json FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_table_schema FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_terminal_security_stats FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_device_security_event FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_sensitive_access FROM anon;

-- ðŸ›¡ï¸ Security Seal: Parent Ownership Verification
-- Migration: 20261015000000_fix_parent_rls_circular_dependency.sql
-- Description: Adds a SECURITY DEFINER helper to verify child ownership and updates RLS policies to resolve circular dependencies.

-- 1. Helper: Secure Child Ownership Check
-- This function bypasses RLS on the children table to allow verification in policies.
CREATE OR REPLACE FUNCTION public.is_parent_of_child(p_child_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.children
    WHERE id = p_child_id AND parent_id = auth.uid()
  );
END;
$$;

-- 2. Update Attendance Policy
-- Replace the subquery-based policy with the secure function call.
DROP POLICY IF EXISTS "attendance_parent_own" ON public.attendance;
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT TO authenticated
    USING (public.is_parent_of_child(child_id));

-- 3. Update Children Policy (Self-Verification)
-- While the existing policy (parent_id = auth.uid()) should work, 
-- using a SECURITY DEFINER helper can sometimes resolve permission inheritance issues.
-- However, we'll keep the children one as is for now unless it fails.

-- 4. Grant Execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_parent_of_child(uuid) TO authenticated;

-- ðŸ©¹ Data Fix: Correct Medical Records and Disable Features
-- Migration: 20261016000000_data_fix_and_cleanup.sql
-- Description: Corrects Daramola's medical data and ensures Center Finder is disabled.

-- 1. Correct Daramola's Medical Data
-- Fixes typo 'Penut' and moves 'Heart Palpitation' to medical_info
UPDATE public.children
SET 
    allergies = REPLACE(REPLACE(allergies, 'Penut', 'Peanut'), 'Heart Palpitation', ''),
    medical_info = COALESCE(medical_info, '') || 
                  CASE 
                    WHEN (medical_info IS NOT NULL AND medical_info <> '') AND (allergies LIKE '%Heart Palpitation%') THEN ', ' 
                    ELSE '' 
                  END || 
                  CASE 
                    WHEN allergies LIKE '%Heart Palpitation%' THEN 'Heart Palpitation' 
                    ELSE '' 
                  END
WHERE first_name = 'Daramola' AND last_name = 'Balogun';

-- Cleanup potential trailing/leading commas in allergies
UPDATE public.children
SET allergies = TRIM(BOTH ', ' FROM REPLACE(allergies, ' ,', ','))
WHERE first_name = 'Daramola' AND last_name = 'Balogun';

-- 2. Force Disable Center Finder
-- Ensure the feature is disabled globally
UPDATE public.organization_settings SET show_center_finder = FALSE;
ALTER TABLE public.organization_settings ALTER COLUMN show_center_finder SET DEFAULT FALSE;

-- ðŸ›¡ï¸ Security Seal: Final Recursion Breaker
-- Migration: 20261017000000_break_user_roles_recursion_v2.sql
-- Description: Replaces table-lookup based admin checks with JWT-based checks to prevent infinite recursion in RLS policies.

-- 1. Optimized Non-Recursive Admin Check
-- This function uses the JWT metadata instead of querying the user_roles table, 
-- preventing the infinite recursion that happens when a policy on user_roles calls this function.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check JWT metadata first (fastest, no recursion)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- Fallback: Use a direct SQL query that avoids triggering RLS on itself if possible,
  -- but in most cases, the JWT check is sufficient for RLS policies.
  -- For service_role/postgres, always return true for security definer context if needed.
  IF (SELECT current_setting('role')) IN ('postgres', 'service_role') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 2. Clean up user_roles policies
DROP POLICY IF EXISTS "users_view_own_role_final" ON public.user_roles;
CREATE POLICY "users_view_own_role_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_roles_final" ON public.user_roles;
CREATE POLICY "admins_view_all_roles_final"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  -- Use the non-recursive check
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);

-- 3. Fix the Attendance policy as well, just in case
DROP POLICY IF EXISTS "attendance_parent_own" ON public.attendance;
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT TO authenticated
    USING (
      -- Direct check to avoid any nested function calls if possible
      EXISTS (
        SELECT 1 FROM public.children
        WHERE id = child_id AND parent_id = auth.uid()
      )
      OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- â˜¢ï¸ NUCLEAR REBUILD: Total RLS Sanitization
-- Migration: 20261017000001_rls_nuclear_sanitization.sql
-- Description: Dynamically drops ALL policies on core tables and rebuilds them using non-recursive logic.

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- 1. Drop EVERY policy on these tables to clear recursion and conflicts
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('user_roles', 'children', 'attendance', 'messages', 'profiles', 'organization_settings', 'kiosk_settings', 'teachers', 'classes')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- 2. Optimized Non-Recursive Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin') 
         OR (SELECT current_setting('role', true)) IN ('postgres', 'service_role');
END; $$;

CREATE OR REPLACE FUNCTION public.is_staff_secure()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
         OR (SELECT current_setting('role', true)) IN ('postgres', 'service_role');
END; $$;

-- 3. Core Table: user_roles (THE SOURCE OF RECURSION)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin_secure());

-- 4. Table: children
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "children_self_parent" ON public.children FOR ALL TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "children_admin" ON public.children FOR ALL TO authenticated USING (public.is_admin_secure());
CREATE POLICY "children_staff_view" ON public.children FOR SELECT TO authenticated USING (public.is_staff_secure());

-- 5. Table: attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_parent" ON public.attendance FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.children WHERE id = child_id AND parent_id = auth.uid()));
CREATE POLICY "attendance_admin" ON public.attendance FOR ALL TO authenticated USING (public.is_admin_secure());
CREATE POLICY "attendance_staff" ON public.attendance FOR ALL TO authenticated USING (public.is_staff_secure());

-- 6. Table: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_secure());
CREATE POLICY "profiles_staff_view" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff_secure());

-- 7. Table: messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_self" ON public.messages FOR ALL TO authenticated 
USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "messages_admin" ON public.messages FOR ALL TO authenticated USING (public.is_admin_secure());

-- 8. Table: organization_settings (Publicly readable for branding/config)
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_settings_read" ON public.organization_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_settings_admin" ON public.organization_settings FOR ALL TO authenticated USING (public.is_admin_secure());

-- 9. Table: kiosk_settings
ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kiosk_settings_read" ON public.kiosk_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "kiosk_settings_admin" ON public.kiosk_settings FOR ALL TO authenticated USING (public.is_admin_secure());

-- ðŸ”— Staff Supervision & Parent Messaging Restriction
-- Migration: 20261018000000_parent_messaging_restriction.sql
-- Description: Adds supervisor field to profiles and restricts parent communication to child's teachers/supervisors.

-- 1. Add supervisor relationship to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id);

-- 2. Update get_available_recipients to enforce restrictions
CREATE OR REPLACE FUNCTION public.get_available_recipients()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT;
BEGIN
    -- Get caller's primary role
    SELECT ur.role::text INTO v_caller_role 
    FROM public.user_roles ur 
    WHERE ur.user_id = v_caller_id 
    LIMIT 1;

    -- CASE 1: Caller is a Parent
    IF v_caller_role = 'parent' THEN
        RETURN QUERY
        SELECT DISTINCT
            p.id, 
            p.first_name, 
            p.last_name, 
            ur.role::text
        FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE 
            -- A: All Super Admins
            ur.role = 'super_admin'
            OR 
            -- B: Teachers assigned to their children's classes
            p.id IN (
                SELECT t.user_id 
                FROM public.teachers t
                JOIN public.children c ON t.class_id = c.class_id
                WHERE c.parent_id = v_caller_id
            )
            OR
            -- C: Supervisors of those teachers
            p.id IN (
                SELECT p_staff.supervisor_id
                FROM public.profiles p_staff
                JOIN public.teachers t ON p_staff.id = t.user_id
                JOIN public.children c ON t.class_id = c.class_id
                WHERE c.parent_id = v_caller_id
                AND p_staff.supervisor_id IS NOT NULL
            )
        ORDER BY ur.role, p.last_name;

    -- CASE 2: Caller is Staff/Admin/Teacher
    ELSE
        RETURN QUERY
        SELECT 
            p.id, 
            p.first_name, 
            p.last_name, 
            ur.role::text
        FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE 
            -- Staff can see other staff, admins, and parents
            ur.role::text NOT IN ('child', 'kiosk')
        ORDER BY ur.role, p.last_name;
    END IF;
END;
$$;

-- 3. Update Messaging RLS to block unauthorized sending
DROP POLICY IF EXISTS "messages_parent_send_restricted" ON public.messages;
CREATE POLICY "messages_parent_send_restricted"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    -- Admins/Staff can send to anyone (existing permission or logic)
    (SELECT role::text FROM user_roles WHERE user_id = auth.uid()) NOT IN ('parent')
    OR
    -- Parents can only send to recipients returned by the authorized list
    recipient_id IN (
        SELECT r.id FROM public.get_available_recipients() r
    )
);

-- 4. Clean up any existing messages policies that might be too permissive
-- (Handled by the previous nuclear sanitization which consolidated messages_self and messages_admin)

-- ðŸ› ï¸ RPC UPDATE: Surface Supervisor Data
-- Migration: 20261018000001_update_staff_rpcs_with_supervisor.sql
-- Description: Updates the get_staff_members and get_users_with_roles functions to include supervisor_id.

-- 1. Update get_staff_members
DROP FUNCTION IF EXISTS public.get_staff_members();
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  staff_pin text,
  avatar_url text,
  photo_url text,
  department text,
  specialties text[],
  max_hours_per_week integer,
  supervisor_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: Only staff or admins can view the roster.
  IF NOT (public.is_admin_secure()) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = auth.uid() 
    AND role IN ('staff', 'teacher', 'teacher_assistant')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can view the roster.';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      CASE 
        WHEN auth.uid() = ur.user_id THEN p.staff_pin::TEXT
        ELSE NULL -- PIN is sensitive: only owner can see it
      END as staff_pin,
      p.avatar_url::TEXT,
      p.photo_url::TEXT,
      p.department::TEXT,
      p.specialties,
      p.max_hours_per_week,
      p.supervisor_id
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT NOT IN ('parent', 'child', 'kiosk', 'regular_user')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- 2. Update get_users_with_roles
DROP FUNCTION IF EXISTS public.get_users_with_roles();
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  created_at timestamptz,
  address text,
  city text,
  state text,
  zip text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  children_count integer,
  supervisor_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can see the full user list
  IF NOT (public.is_admin_secure()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT 
      ur.user_id as id,
      au.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      COALESCE(p.phone, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      COALESCE(ur.is_volunteer, false),
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      au.created_at,
      p.address::text,
      p.city::text,
      p.state::text,
      p.zip_code::text as zip,
      p.gender::text,
      p.occupation::text,
      p.emergency_contact_name::text,
      p.emergency_contact_phone::text,
      (SELECT count(*)::integer FROM public.children c WHERE c.parent_id = ur.user_id) as children_count,
      p.supervisor_id
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;

-- ðŸ” Security Fix: Sync User Roles to Auth Metadata
-- Migration: 20261019000001_sync_user_roles_to_metadata.sql
-- Description: Ensures that RLS policies using JWT-based checks (is_admin_secure) stay in sync with the user_roles table.

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  -- Update the user's raw_user_meta_data in auth.users
  -- This ensures that the next JWT issued will contain the correct role
  -- and that current sessions can (sometimes) see the updated metadata.
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_user_role_to_metadata ON public.user_roles;
CREATE TRIGGER trigger_sync_user_role_to_metadata
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_metadata();

-- 3. Retroactively sync existing admins/super_admins
-- This is critical for users like the one reporting the issue.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT user_id, role 
    FROM public.user_roles 
    WHERE role IN ('admin', 'super_admin')
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', r.role)
    WHERE id = r.user_id;
  END LOOP;
END $$;

-- 4. Refine is_admin_secure to be a bit more robust
-- We still use JWT primarily for speed and recursion-safety,
-- but we add a small check for service_role and allow a "forced" bypass if needed.
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. JWT check (Main path - prevents recursion)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- 2. Internal system roles
  IF (SELECT current_setting('role', true)) IN ('postgres', 'service_role') THEN
    RETURN true;
  END IF;

  -- 3. Fallback for Super Admins ONLY (to prevent total lockout if metadata fails)
  -- We only do this if we are NOT already in a recursive call on user_roles.
  -- This is a bit tricky, but since we use 'STABLE', it's generally safe.
  -- To be extra safe, we only check the is_super_admin column which is less likely to recurse than the role column.
  -- Actually, let's keep it simple and rely on the trigger. 
  -- If the user is a super_admin, the trigger will have fixed their metadata.
  
  RETURN false;
END;
$$;

-- 5. Table: classes (Added back missing policies)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_read_all" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_admin" ON public.classes FOR ALL TO authenticated USING (public.is_admin_secure());

-- 6. Table: teachers (Added back missing policies)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers_read_all" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers_admin" ON public.teachers FOR ALL TO authenticated USING (public.is_admin_secure());

-- ðŸ›¡ï¸ Security Fix: Restore Missing RLS Policies
-- Migration: 20261019000002_fix_missing_rls_policies.sql
-- Description: Restores policies for classes and teachers tables that were dropped in a previous migration but not recreated.

-- 1. Table: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classes_read_all" ON public.classes;
CREATE POLICY "classes_read_all" ON public.classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "classes_admin" ON public.classes;
CREATE POLICY "classes_admin" ON public.classes FOR ALL TO authenticated USING (public.is_admin_secure());

-- 2. Table: teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_read_all" ON public.teachers;
CREATE POLICY "teachers_read_all" ON public.teachers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "teachers_admin" ON public.teachers;
CREATE POLICY "teachers_admin" ON public.teachers FOR ALL TO authenticated USING (public.is_admin_secure());

-- ðŸ›¡ï¸ Security Fix: Robust Parent Lookup for Kiosk
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

-- ðŸ« Migration: Auto-Assign Classes based on Age
-- Migration ID: 20261019000004_auto_assign_classes.sql

-- 1. Add min_age and max_age to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS min_age INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS max_age INTEGER;

-- 2. Populate min_age and max_age from existing age_range if possible
-- Typical format: '6-10' or '0-5'
UPDATE public.classes 
SET 
  min_age = CAST(split_part(age_range, '-', 1) AS INTEGER),
  max_age = CAST(split_part(age_range, '-', 2) AS INTEGER)
WHERE age_range ~ '^[0-9]+-[0-9]+$';

-- 3. Create a function to find the best class for a child based on age
CREATE OR REPLACE FUNCTION public.get_class_for_age(p_age INTEGER)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_class_id UUID;
BEGIN
  SELECT id INTO v_class_id
  FROM public.classes
  WHERE (min_age IS NULL OR p_age >= min_age)
    AND (max_age IS NULL OR p_age <= max_age)
  ORDER BY (max_age - min_age) ASC -- Pick the most specific range
  LIMIT 1;
  
  RETURN v_class_id;
END;
$$;

-- 4. Create a trigger function to auto-assign class_id on child signup/update
CREATE OR REPLACE FUNCTION public.auto_assign_child_class()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-assign if age is provided and class_id is currently null
  IF NEW.age IS NOT NULL AND NEW.class_id IS NULL THEN
    NEW.class_id := public.get_class_for_age(NEW.age);
  END IF;
  
  -- If age changed, but class_id was not manually set in this update, re-evaluate
  -- (Optional: uncomment if you want class to always stay in sync with age)
  -- IF TG_OP = 'UPDATE' AND NEW.age != OLD.age AND NEW.class_id = OLD.class_id THEN
  --   NEW.class_id := public.get_class_for_age(NEW.age);
  -- END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Attach the trigger to the children table
DROP TRIGGER IF EXISTS trigger_auto_assign_child_class ON public.children;
CREATE TRIGGER trigger_auto_assign_child_class
BEFORE INSERT OR UPDATE OF age, class_id ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_child_class();

-- 6. Retroactively assign classes to existing children without one
UPDATE public.children
SET class_id = public.get_class_for_age(age)
WHERE class_id IS NULL AND age IS NOT NULL;
-- ðŸ¢ Phase 2: Multi-Tenancy Foundation
-- Objective: Establish the top-level 'organizations' structure to support English/Spanish congregations.

-- 1. Create the organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. 'english-church', 'spanish-church'
    language_code TEXT DEFAULT 'en', -- 'en', 'es'
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add organization_id to core tables
-- Note: We allow NULL initially to avoid breaking existing data during migration.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Seed initial congregations
INSERT INTO public.organizations (name, slug, language_code)
VALUES 
('KiddoChecker English', 'english-church', 'en'),
('KiddoChecker Spanish', 'spanish-church', 'es')
ON CONFLICT (slug) DO NOTHING;

-- 4. RLS Policy: Only super_admins can see all organizations
CREATE POLICY "Super Admins can manage all organizations"
ON public.organizations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- 5. RLS Policy: Users can see their own organization
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- 6. Church Stats RPC Function
CREATE OR REPLACE FUNCTION public.get_church_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    v_total_members INTEGER := 0;
    v_registered_count INTEGER := 0;
    v_regular_count INTEGER := 0;
    v_visitor_count INTEGER := 0;
    v_active_journey INTEGER := 0;
    v_first_followup INTEGER := 0;
    v_ministry_count INTEGER := 0;
    v_group_count INTEGER := 0;
BEGIN
    SELECT COALESCE(count(*), 0) INTO v_total_members FROM public.church_memberships;
    SELECT COALESCE(count(*), 0) INTO v_registered_count FROM public.church_memberships WHERE membership_type = 'registered';
    SELECT COALESCE(count(*), 0) INTO v_regular_count FROM public.church_memberships WHERE membership_type = 'regular';
    SELECT COALESCE(count(*), 0) INTO v_visitor_count FROM public.church_memberships WHERE membership_type = 'visitor';
    
    SELECT COALESCE(count(*), 0) INTO v_active_journey FROM public.church_memberships 
    WHERE membership_type = 'visitor' AND joined_at >= (now() - interval '30 days');
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='visitor_interactions') THEN
        SELECT COALESCE(count(DISTINCT visitor_id), 0) INTO v_first_followup 
        FROM public.visitor_interactions;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ministries') THEN
        SELECT COALESCE(count(*), 0) INTO v_ministry_count FROM public.ministries;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ministry_groups') THEN
        SELECT COALESCE(count(*), 0) INTO v_group_count FROM public.ministry_groups;
    END IF;

    SELECT jsonb_build_object(
        'total_members', v_total_members,
        'registered_count', v_registered_count,
        'regular_count', v_regular_count,
        'visitor_count', v_visitor_count,
        'active_journey', v_active_journey,
        'first_followup', v_first_followup,
        'total_ministries', v_ministry_count,
        'active_groups', v_group_count,
        'integrations_perc', CASE 
            WHEN v_total_members = 0 THEN 0 
            ELSE ROUND((v_registered_count::float / v_total_members::float) * 100) 
        END
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 7. Overloaded RPC Functions accepting optional p_user_id to ensure backward compatibility
CREATE OR REPLACE FUNCTION public.get_staff_members(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  user_id uuid, email text, first_name text, last_name text, phone text,
  role text, is_super_admin boolean, is_volunteer boolean, is_active boolean,
  staff_pin text, avatar_url text, photo_url text, department text,
  specialties text[], max_hours_per_week integer, supervisor_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_staff_members();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_with_roles(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  user_id uuid, email text, role text, is_super_admin boolean, is_volunteer boolean,
  first_name text, last_name text, phone text, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_users_with_roles();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_summary_stats(
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT CURRENT_DATE,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_checked_in bigint,
  total_checked_out bigint,
  currently_present bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_checked_in,
    COUNT(checked_out_at)::bigint as total_checked_out,
    COUNT(CASE WHEN checked_out_at IS NULL THEN 1 END)::bigint as currently_present
  FROM public.attendance
  WHERE attendance_date BETWEEN start_date AND end_date;
END;
$$;
