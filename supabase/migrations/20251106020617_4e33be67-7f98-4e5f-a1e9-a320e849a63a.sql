-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_staff_members();

-- Recreate with correct return type including is_volunteer
CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email,
      p.first_name,
      p.last_name,
      p.phone,
      ur.role::TEXT,
      ur.is_super_admin,
      ur.is_volunteer,
      (au.email_confirmed_at IS NOT NULL) AS is_active
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role IN ('admin', 'staff', 'teacher', 'teacher_assistant')
    ORDER BY 
      p.last_name, p.first_name;
END;
$$;