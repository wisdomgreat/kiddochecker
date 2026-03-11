-- Migration: enhance_shifts_for_kiosk
-- Add actual check-in/out times to shifts

ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kiosk_id TEXT;

-- Update status check constraint if needed (status is already text)
-- No need to change it, 'confirmed' or 'completed' can be used.
