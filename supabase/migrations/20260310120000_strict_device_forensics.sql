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
