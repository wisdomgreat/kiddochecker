-- Migration: Security Analytics functions
-- Provides data for the "World Class Reporting" dashboard

CREATE OR REPLACE FUNCTION get_terminal_security_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_terminals', (SELECT count(*) FROM enrolled_devices),
        'active_terminals', (SELECT count(*) FROM enrolled_devices WHERE status = 'active'),
        'locked_terminals', (SELECT count(*) FROM enrolled_devices WHERE security_status = 'locked'),
        'flagged_terminals', (SELECT count(*) FROM enrolled_devices WHERE security_status = 'flagged'),
        'security_events_last_24h', (SELECT count(*) FROM device_activity_log WHERE created_at > now() - interval '24 hours'),
        'alerts_last_24h', (SELECT count(*) FROM device_activity_log WHERE action = 'security_alert' AND created_at > now() - interval '24 hours'),
        'top_alert_devices', (
            SELECT jsonb_agg(d) FROM (
                 SELECT ed.name, count(*) as alert_count
                 FROM device_activity_log dal
                 JOIN enrolled_devices ed ON dal.device_id = ed.id
                 WHERE dal.action = 'security_alert'
                 GROUP BY ed.name
                 ORDER BY alert_count DESC
                 LIMIT 5
            ) d
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
