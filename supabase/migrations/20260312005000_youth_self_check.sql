-- Migration: 20260312005000_youth_self_check.sql

-- Add youth-specific fields to children table
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS allow_self_check BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS youth_pin TEXT;

-- Create an index for PIN lookups
CREATE INDEX IF NOT EXISTS idx_children_pin ON public.children(youth_pin) WHERE youth_pin IS NOT NULL;

-- RPC for Youth Self-Check
DROP FUNCTION IF EXISTS public.youth_self_check_action(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.youth_self_check_action(
    p_pin_code TEXT,
    p_kiosk_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_child_id UUID;
    v_child_name TEXT;
    v_attendance_id UUID;
    v_is_checked_in BOOLEAN;
    v_org_id UUID;
BEGIN
    -- 1. Find the child by PIN
    SELECT id, first_name || ' ' || last_name, organization_id
    INTO v_child_id, v_child_name, v_org_id
    FROM public.children
    WHERE youth_pin = p_pin_code AND allow_self_check = true
    LIMIT 1;

    IF v_child_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN or not authorized for self-check.');
    END IF;

    -- 2. Check current status (is child already checked in?)
    SELECT id INTO v_attendance_id
    FROM public.attendance
    WHERE child_id = v_child_id AND checked_out_at IS NULL
    ORDER BY checked_in_at DESC
    LIMIT 1;

    v_is_checked_in := (v_attendance_id IS NOT NULL);

    IF v_is_checked_in THEN
        -- Perform Check-Out
        UPDATE public.attendance
        SET 
            checked_out_at = now(),
            checked_out_method = 'youth_self_check',
            checked_out_station = p_kiosk_id
        WHERE id = v_attendance_id;

        RETURN jsonb_build_object(
            'success', true, 
            'action', 'checkout', 
            'child_name', v_child_name,
            'message', 'Checked out successfully. See you next time!'
        );
    ELSE
        -- Perform Check-In
        INSERT INTO public.attendance (
            child_id,
            organization_id,
            attendance_date,
            checked_in_at,
            checked_in_method,
            checked_in_station
        ) VALUES (
            v_child_id,
            v_org_id,
            CURRENT_DATE,
            now(),
            'youth_self_check',
            p_kiosk_id
        );

        RETURN jsonb_build_object(
            'success', true, 
            'action', 'checkin', 
            'child_name', v_child_name,
            'message', 'Checked in successfully. Welcome!'
        );
    END IF;
END;
$$;
