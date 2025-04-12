
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
