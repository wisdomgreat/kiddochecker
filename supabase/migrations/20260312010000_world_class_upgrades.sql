-- Migration: 20260312010000_world_class_upgrades.sql
-- Description: Advanced Audit Logging for Medical Data, Conflict-aware scheduling, and Background check status integration.
-- Skill used: postgresql-optimization, security-auditor

-- 1. MEDICAL DATA AUDIT LOGGING
-- Purpose: Track every modification to sensitive medical data for compliance.

CREATE TABLE IF NOT EXISTS public.medical_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medical_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all medical audits" ON public.medical_audit_logs
    FOR SELECT USING (is_admin_secure());

DROP FUNCTION IF EXISTS public.audit_medical_profile_changes();
CREATE OR REPLACE FUNCTION public.audit_medical_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.medical_audit_logs (child_id, actor_id, action, old_data)
        VALUES (OLD.child_id, v_actor_id, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.medical_audit_logs (child_id, actor_id, action, old_data, new_data)
        VALUES (NEW.child_id, v_actor_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.medical_audit_logs (child_id, actor_id, action, new_data)
        VALUES (NEW.child_id, v_actor_id, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_audit_medical_profiles ON public.child_medical_profiles;
CREATE TRIGGER tr_audit_medical_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.child_medical_profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_medical_profile_changes();


-- 2. CONFLICT-AWARE SCHEDULING
-- Purpose: Prevent staff from being double-booked.

DROP FUNCTION IF EXISTS public.check_shift_conflicts(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);
CREATE OR REPLACE FUNCTION public.check_shift_conflicts(
    p_staff_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_ignore_shift_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflict_id UUID,
    conflict_start TIMESTAMPTZ,
    conflict_end TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.start_time, s.end_time
    FROM public.shifts s
    WHERE s.staff_id = p_staff_id
      AND s.status NOT IN ('canceled')
      AND (p_ignore_shift_id IS NULL OR s.id != p_ignore_shift_id)
      AND (
        (p_start_time, p_end_time) OVERLAPS (s.start_time, s.end_time)
      );
END;
$$;


-- 3. BACKGROUND CHECK STATUS SYNC
-- Purpose: Ensure staff_profiles (or similar) has a quick flag for background checks if not already present.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_active_background_check BOOLEAN DEFAULT false;

-- Trigger to auto-update the flag when a police_check or background_check is approved
DROP FUNCTION IF EXISTS public.sync_background_check_status();
CREATE OR REPLACE FUNCTION public.sync_background_check_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.document_type IN ('police_check', 'background_check') AND NEW.status = 'approved') THEN
        UPDATE public.profiles SET has_active_background_check = true WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_background_check ON public.staff_documents;
CREATE TRIGGER tr_sync_background_check
    AFTER INSERT OR UPDATE ON public.staff_documents
    FOR EACH ROW EXECUTE FUNCTION public.sync_background_check_status();


-- 4. MULTI-LOCATION ENHANCEMENT
-- Add a function to find nearest center by location
DROP FUNCTION IF EXISTS public.get_nearest_centers(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
CREATE OR REPLACE FUNCTION public.get_nearest_centers(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    distance_km FLOAT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        id, 
        name, 
        address,
        -- Simple Euclidean distance approximation for display (approx 111km per degree)
        ROUND(((POINT(longitude, latitude) <-> POINT(p_lng, p_lat)) * 111.0)::numeric, 1)::float as distance_km
    FROM public.centers
    WHERE is_active = true
    ORDER BY (POINT(longitude, latitude) <-> POINT(p_lng, p_lat))
    LIMIT p_limit;
$$;
