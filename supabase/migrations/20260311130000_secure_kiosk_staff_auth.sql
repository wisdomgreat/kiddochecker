-- Secure Staff PIN verification for Kiosk terminals
-- This function allows kiosks to verify staff PINs without needing full read access to the profiles table.

CREATE OR REPLACE FUNCTION verify_staff_pin_for_kiosk(p_pin TEXT)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    role app_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        ur.role
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.staff_pin = UPPER(TRIM(p_pin))
    AND ur.role IN ('admin', 'super_admin', 'staff', 'teacher')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users (including kiosks)
GRANT EXECUTE ON FUNCTION verify_staff_pin_for_kiosk(TEXT) TO authenticated;
