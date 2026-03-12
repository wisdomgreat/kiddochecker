-- Migration: 20260312020000_refine_staff_scheduling.sql
-- Description: Add actual clock-in times to shifts and enforce no-conflict rule.

-- 1. ADD CLOCK-IN COLUMNS
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kiosk_id UUID; -- tracked where they clocked in

-- 2. ENFORCE NO-CONFLICTS VIA TRIGGER
CREATE OR REPLACE FUNCTION public.enforce_shift_no_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_id UUID;
BEGIN
    SELECT conflict_id INTO v_conflict_id
    FROM public.check_shift_conflicts(NEW.staff_id, NEW.start_time, NEW.end_time, NEW.id)
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'Staff member already has an overlapping shift (ID: %)', v_conflict_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_shift_conflicts ON public.shifts;
CREATE TRIGGER tr_enforce_shift_conflicts
    BEFORE INSERT OR UPDATE OF staff_id, start_time, end_time ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_shift_no_conflicts();

-- 3. HELPER FOR KIOSK SHIFT ACTIONS (used by frontend handleShiftAction)
CREATE OR REPLACE FUNCTION public.staff_shift_action_kiosk(
    p_shift_id UUID,
    p_action TEXT, -- 'check_in', 'check_out'
    p_kiosk_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shift RECORD;
BEGIN
    SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shift not found');
    END IF;

    IF p_action = 'check_in' THEN
        IF v_shift.actual_start_time IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Already checked into this shift');
        END IF;

        UPDATE public.shifts 
        SET actual_start_time = now(), 
            kiosk_id = p_kiosk_id,
            status = 'confirmed'
        WHERE id = p_shift_id;
        
        RETURN jsonb_build_object('success', true);
    ELSIF p_action = 'check_out' THEN
        IF v_shift.actual_start_time IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Not checked into this shift yet');
        END IF;
        
        IF v_shift.actual_end_time IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Already checked out of this shift');
        END IF;

        UPDATE public.shifts 
        SET actual_end_time = now(),
            status = 'completed'
        WHERE id = p_shift_id;

        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
    END IF;
END;
$$;

-- 4. HELPER TO FETCH TODAY'S SHIFTS FOR STAFF (used by frontend)
CREATE OR REPLACE FUNCTION public.get_staff_shifts_for_kiosk(
    p_pin TEXT
)
RETURNS TABLE (
    shift_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    role_type TEXT,
    class_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
BEGIN
    SELECT id INTO v_staff_id FROM public.profiles WHERE pin_code = p_pin;
    
    IF v_staff_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        s.id, s.start_time, s.end_time, s.actual_start_time, s.actual_end_time, s.role_type, c.name
    FROM public.shifts s
    LEFT JOIN public.classes c ON s.class_id = c.id
    WHERE s.staff_id = v_staff_id
      AND s.start_time::date = current_date
      AND s.status != 'canceled'
    ORDER BY s.start_time ASC;
END;
$$;
