
-- Create functions for getting user emails (for admin use)
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(
  id uuid,
  email text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the role of the requesting user
  SELECT role::text INTO requesting_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Only return data if requesting user is admin or super_admin
  IF requesting_user_role = 'admin' OR requesting_user_role = 'super_admin' THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email
    FROM 
      auth.users au
    ORDER BY 
      au.email;
  ELSE
    -- Return only the requesting user's email for non-admins
    RETURN QUERY
    SELECT 
      auth.uid() as id,
      au.email
    FROM 
      auth.users au
    WHERE
      au.id = auth.uid();
  END IF;
END;
$$;

-- Fix the database function for attendance report
CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date)
RETURNS TABLE(
  attendance_date date,
  total_checked_in integer,
  total_checked_out integer,
  class_name text,
  class_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      a.attendance_date,
      COUNT(a.id) FILTER (WHERE a.checked_in_at IS NOT NULL)::INTEGER as total_checked_in,
      COUNT(a.id) FILTER (WHERE a.checked_out_at IS NOT NULL)::INTEGER as total_checked_out,
      c.name as class_name,
      c.id as class_id
    FROM 
      attendance a
    LEFT JOIN 
      classes c ON a.class_id = c.id
    WHERE 
      a.attendance_date BETWEEN start_date AND end_date
    GROUP BY 
      a.attendance_date, c.name, c.id
    ORDER BY 
      a.attendance_date DESC, c.name;
END;
$$;
