-- Migration: 20260312004000_broaden_reports.sql

-- Update the Liability Audit Report to return all accountability fields including signature
CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date)
RETURNS TABLE (
    attendance_id UUID,
    attendance_date DATE,
    child_name TEXT,
    child_age INTEGER,
    has_allergies BOOLEAN,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_name TEXT,
    checked_in_by_role TEXT,
    checked_in_method TEXT,
    checked_in_station TEXT,
    checked_out_at TIMESTAMPTZ,
    checked_out_by_name TEXT,
    checked_out_by_role TEXT,
    checked_out_method TEXT,
    checked_out_station TEXT,
    duration_hours NUMERIC,
    signature_data TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as attendance_id,
        a.attendance_date,
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
        ch.age as child_age,
        (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies,
        COALESCE(cl.name, 'Unassigned') as class_name,
        a.checked_in_at,
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name,
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role,
        a.checked_in_method,
        a.checked_in_station,
        a.checked_out_at,
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name,
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role,
        a.checked_out_method,
        a.checked_out_station,
        CASE 
            WHEN a.checked_out_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0
            ELSE NULL
        END as duration_hours,
        a.signature_data
    FROM attendance a
    JOIN children ch ON a.child_id = ch.id
    LEFT JOIN classes cl ON a.class_id = cl.id
    LEFT JOIN profiles p_in ON a.checked_in_by = p_in.id
    LEFT JOIN profiles p_out ON a.checked_out_by = p_out.id
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE
    WHERE a.attendance_date BETWEEN start_date AND end_date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$;
