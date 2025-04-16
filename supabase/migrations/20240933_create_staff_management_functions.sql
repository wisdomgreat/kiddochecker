
-- Function to get all staff members
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT,
  is_super_admin BOOLEAN,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      auth.users.email,
      profiles.first_name,
      profiles.last_name,
      profiles.phone,
      ur.role::TEXT,
      ur.is_super_admin,
      auth.users.confirmed_at IS NOT NULL AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users ON ur.user_id = auth.users.id
    LEFT JOIN 
      public.profiles ON ur.user_id = profiles.id
    WHERE 
      ur.role IN ('admin', 'staff', 'teacher')
    ORDER BY 
      profiles.last_name, profiles.first_name;
END;
$$;
