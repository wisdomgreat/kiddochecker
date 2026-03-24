
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
