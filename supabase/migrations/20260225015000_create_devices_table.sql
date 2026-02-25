-- Simplest possible table creation to debug
CREATE TABLE IF NOT EXISTS public.enrolled_devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL,
  enrollment_code   TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT now()
);
