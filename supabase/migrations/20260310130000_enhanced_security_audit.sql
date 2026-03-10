-- Migration: Enhanced Security Audit and Failure Tracking
-- Date: 2026-03-10

ALTER TABLE public.enrolled_devices
  ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_status TEXT DEFAULT 'secure'; -- 'secure', 'flagged', 'locked'

-- Function to handle session heartbeats or security alerts centrally
CREATE OR REPLACE FUNCTION public.log_device_security_event(
    p_device_id UUID, 
    p_action TEXT, 
    p_metadata JSONB,
    p_is_failure BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.device_activity_log (device_id, action, metadata)
    VALUES (p_device_id, p_action, p_metadata);

    IF p_is_failure THEN
        UPDATE public.enrolled_devices
        SET failure_count = failure_count + 1,
            security_status = CASE WHEN failure_count + 1 >= 5 THEN 'flagged' ELSE security_status END
        WHERE id = p_device_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
