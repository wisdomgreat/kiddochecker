
-- Advanced Safety and Liability Reporting Functions

-- 1. Ratio Violation Report
-- Identifies moments or classes where the current attendance exceeds designated capacity
CREATE OR REPLACE FUNCTION public.get_ratio_alerts(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    class_id UUID,
    class_name TEXT,
    current_count BIGINT,
    capacity INTEGER,
    violation_level TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.name as class_name,
        COUNT(a.id) as current_count,
        COALESCE(c.capacity, 10) as capacity, -- Default to 10 if null
        CASE 
            WHEN COUNT(a.id) > COALESCE(c.capacity, 10) THEN 'Critical'
            WHEN COUNT(a.id) >= (COALESCE(c.capacity, 10) * 0.9) THEN 'Warning'
            ELSE 'Safe'
        END as violation_level
    FROM classes c
    LEFT JOIN attendance a ON c.id = a.class_id 
        AND a.attendance_date = p_date
        AND a.checked_in_at IS NOT NULL 
        AND a.checked_out_at IS NULL
    GROUP BY c.id, c.name, c.capacity
    HAVING COUNT(a.id) >= (COALESCE(c.capacity, 10) * 0.9); -- Only show warnings/violations
END;
$$;

-- 2. Enhanced Liability Audit Report
-- Returns full details of check-ins/outs including the identities of the adults involved
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    duration_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;

-- 3. Safety Peak Time Analysis (Heatmap data)
CREATE OR REPLACE FUNCTION public.get_attendance_heatmap(start_date date, end_date date)
RETURNS TABLE (
    hour_of_day INTEGER,
    avg_count NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    WITH hourly_counts AS (
        SELECT 
            attendance_date,
            EXTRACT(HOUR FROM checked_in_at)::INTEGER as checkin_hour,
            COUNT(*) as count
        FROM attendance
        WHERE attendance_date BETWEEN start_date AND end_date
          AND checked_in_at IS NOT NULL
        GROUP BY attendance_date, EXTRACT(HOUR FROM checked_in_at)
    )
    SELECT 
        checkin_hour as hour_of_day,
        ROUND(AVG(count), 1) as avg_count
    FROM hourly_counts
    GROUP BY checkin_hour
    ORDER BY hour_of_day;
END;
$$;

-- 4. No-Show Report
-- Identifies children assigned to a class who have not checked in for the given date
CREATE OR REPLACE FUNCTION public.get_no_show_report(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    child_id UUID,
    child_name TEXT,
    class_name TEXT,
    parent_phone TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ch.id,
        CONCAT(ch.first_name, ' ', ch.last_name),
        COALESCE(cl.name, 'Unassigned'),
        ch.emergency_contact_phone
    FROM children ch
    LEFT JOIN classes cl ON ch.class_id = cl.id
    WHERE ch.class_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM attendance a 
          WHERE a.child_id = ch.id 
          AND a.attendance_date = p_date
          AND a.checked_in_at IS NOT NULL
      )
    ORDER BY cl.name, ch.last_name;
END;
$$;
