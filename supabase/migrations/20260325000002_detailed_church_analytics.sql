-- ⛪ Detailed Church Management Analytics
-- Description: Updates the church stats RPC to provide real funnel data and active journey metrics for the dashboard.

CREATE OR REPLACE FUNCTION get_church_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    v_total_members INTEGER;
    v_registered_count INTEGER;
    v_regular_count INTEGER;
    v_visitor_count INTEGER;
    v_active_journey INTEGER;
    v_first_followup INTEGER;
    v_ministry_count INTEGER;
    v_group_count INTEGER;
BEGIN
    -- Basic counts
    SELECT count(*) INTO v_total_members FROM church_memberships;
    SELECT count(*) INTO v_registered_count FROM church_memberships WHERE membership_type = 'registered';
    SELECT count(*) INTO v_regular_count FROM church_memberships WHERE membership_type = 'regular';
    SELECT count(*) INTO v_visitor_count FROM church_memberships WHERE membership_type = 'visitor';
    
    -- Active Journey: Visitors joined in the last 30 days
    SELECT count(*) INTO v_active_journey FROM church_memberships 
    WHERE membership_type = 'visitor' AND joined_at >= (now() - interval '30 days');
    
    -- First Follow-up: Visitors with at least one interaction
    SELECT count(DISTINCT visitor_id) INTO v_first_followup 
    FROM visitor_interactions 
    WHERE visitor_id IN (SELECT profile_id FROM church_memberships WHERE membership_type = 'visitor' AND profile_id IS NOT NULL);

    SELECT count(*) INTO v_ministry_count FROM ministries;
    SELECT count(*) INTO v_group_count FROM ministry_groups;

    SELECT jsonb_build_object(
        'total_members', v_total_members,
        'registered_count', v_registered_count,
        'regular_count', v_regular_count,
        'visitor_count', v_visitor_count,
        'active_journey', v_active_journey,
        'first_followup', COALESCE(v_first_followup, 0),
        'total_ministries', v_ministry_count,
        'active_groups', v_group_count,
        'integrations_perc', CASE 
            WHEN v_visitor_count = 0 THEN 0 
            ELSE ROUND((v_registered_count::float / NULLIF(v_total_members, 0)::float) * 100) 
        END
    ) INTO result;
    
    RETURN result;
END;
$$;
