-- Enhanced Reporting RPCs
CREATE OR REPLACE FUNCTION get_staff_performance_stats(start_date DATE, end_date DATE)
RETURNS TABLE (
    staff_id UUID,
    staff_name TEXT,
    checkin_count BIGINT,
    checkout_count BIGINT,
    avg_processing_time_min FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as staff_id,
        p.first_name || ' ' || p.last_name as staff_name,
        COUNT(a.id) FILTER (WHERE a.checked_in_at BETWEEN (start_date || ' 00:00:00')::TIMESTAMP AND (end_date || ' 23:59:59')::TIMESTAMP) as checkin_count,
        COUNT(a.id) FILTER (WHERE a.checked_out_at BETWEEN (start_date || ' 00:00:00')::TIMESTAMP AND (end_date || ' 23:59:59')::TIMESTAMP) as checkout_count,
        0.0::FLOAT as avg_processing_time_min
    FROM profiles p
    LEFT JOIN attendance a ON (a.checked_in_by = p.id OR a.checked_out_by = p.id)
    GROUP BY p.id, p.first_name, p.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_attendance_growth_stats()
RETURNS TABLE (
    week_start DATE,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('week', created_at)::DATE as week_start,
        COUNT(*) as count
    FROM profiles
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;