-- Migration: 20260311233000_youth_self_check.sql

ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS youth_pin TEXT,
ADD COLUMN IF NOT EXISTS allow_self_check BOOLEAN DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.children.youth_pin IS 'Secure 4-8 digit PIN for youth self-check-out/in';
COMMENT ON COLUMN public.children.allow_self_check IS 'Whether this child is allowed to use the Youth Self-Check kiosk';
