
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
