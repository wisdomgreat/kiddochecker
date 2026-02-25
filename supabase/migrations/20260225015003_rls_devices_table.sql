-- Add RLS to enrolled_devices
ALTER TABLE public.enrolled_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to enrolled_devices" ON public.enrolled_devices;
CREATE POLICY "Admin full access to enrolled_devices"
  ON public.enrolled_devices
  FOR ALL
  TO authenticated
  USING (public.is_admin_secure())
  WITH CHECK (public.is_admin_secure());

DROP POLICY IF EXISTS "Staff can view active enrolled_devices" ON public.enrolled_devices;
CREATE POLICY "Staff can view active enrolled_devices"
  ON public.enrolled_devices
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND (
      public.is_admin_secure() 
      OR public.has_role_secure('staff'::public.app_role)
      OR public.has_role_secure('teacher'::public.app_role)
      OR public.has_role_secure('teacher_assistant'::public.app_role)
    )
  );

-- Audit table
CREATE TABLE IF NOT EXISTS public.device_activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID REFERENCES public.enrolled_devices(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address   TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.device_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin access to device_activity_log" ON public.device_activity_log;
CREATE POLICY "Admin access to device_activity_log"
  ON public.device_activity_log
  FOR ALL
  TO authenticated
  USING (public.is_admin_secure())
  WITH CHECK (public.is_admin_secure());
