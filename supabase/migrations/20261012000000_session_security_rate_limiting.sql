-- 🛡️ Phase 4: Session Security & Rate Limiting
-- Migration: 20261012000000_session_security_rate_limiting.sql

-- 1. Security Attempts Table (Rate Limiting Audit)
CREATE TABLE IF NOT EXISTS public.security_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'mfa_verify', 'staff_pin', 'password_change', 'login'
    status TEXT NOT NULL, -- 'success', 'failure'
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for rate-limit performance
CREATE INDEX IF NOT EXISTS idx_security_attempts_lookup 
ON public.security_attempts (user_id, action, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.security_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can view logs, users can't see anything (it's internal)
CREATE POLICY "Admins can view security logs"
ON public.security_attempts FOR SELECT
TO authenticated
USING (public.is_admin_secure());

-- 2. Rate Limit Logic
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_max_attempts INT,
    p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT count(*) INTO v_count
    FROM public.security_attempts
    WHERE user_id = p_user_id
    AND action = p_action
    AND status = 'failure'
    AND created_at > (now() - (p_window_minutes || ' minutes')::INTERVAL);
    
    RETURN v_count < p_max_attempts;
END;
$$;

-- 3. Log Security Attempt helper
CREATE OR REPLACE FUNCTION public.log_security_attempt(
    p_user_id UUID,
    p_action TEXT,
    p_status TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_attempts (user_id, action, status, metadata)
    VALUES (p_user_id, p_action, p_status, p_metadata);
END;
$$;

-- 4. Harden Staff PIN Verification with Rate Limiting
DROP FUNCTION IF EXISTS public.verify_staff_pin_for_kiosk(text);
CREATE OR REPLACE FUNCTION public.verify_staff_pin_for_kiosk(p_pin TEXT)

RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role app_role
) AS $$
DECLARE
    v_target_id UUID;
BEGIN
    -- Rate limit by the current authenticated user (the Kiosk device/session)
    IF NOT public.check_rate_limit(auth.uid(), 'staff_pin_verify', 5, 15) THEN
        RAISE EXCEPTION 'Too many failed PIN attempts. Station locked for 15 minutes.';
    END IF;

    -- Search for the staff member
    SELECT p.id INTO v_target_id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.staff_pin = UPPER(TRIM(p_pin))
    AND ur.role IN ('admin', 'super_admin', 'staff', 'teacher')
    LIMIT 1;

    IF v_target_id IS NOT NULL THEN
        -- Log success
        PERFORM public.log_security_attempt(auth.uid(), 'staff_pin_verify', 'success', jsonb_build_object('staff_id', v_target_id));
        
        RETURN QUERY
        SELECT 
            p.id, 
            p.first_name, 
            p.last_name, 
            ur.role
        FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.id = v_target_id;
    ELSE
        -- Log failure
        PERFORM public.log_security_attempt(auth.uid(), 'staff_pin_verify', 'failure');
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Active Session Management
-- Allows users to see their own active sessions for security monitoring
DROP FUNCTION IF EXISTS public.get_my_active_sessions();
CREATE OR REPLACE FUNCTION public.get_my_active_sessions()

RETURNS TABLE (
    id UUID,
    ip TEXT,
    user_agent TEXT,
    last_accessed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.ip,
        s.user_agent,
        s.last_accessed_at
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.last_accessed_at DESC;
END;
$$;

-- Allows users to revoke a specific session (e.g. from a stolen device)
CREATE OR REPLACE FUNCTION public.revoke_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM auth.sessions
    WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;

