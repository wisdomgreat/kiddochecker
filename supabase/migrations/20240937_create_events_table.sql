
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
