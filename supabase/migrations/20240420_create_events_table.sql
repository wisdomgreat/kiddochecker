
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
