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
