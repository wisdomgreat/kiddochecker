-- [PROD HOTFIX] Restoring Administrative and Analytics RPCs
-- These were identified as missing during the production audit.

-- 1. get_attendance_summary_secure (Required for Dashboard Stats)
CREATE OR REPLACE FUNCTION public.get_attendance_summary_secure(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  attendance_date date,
  class_id uuid,
  class_name text,
  total_children bigint,
  checked_in_count bigint,
  checked_out_count bigint,
  currently_present bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.attendance_date,
    c.id as class_id,
    c.name as class_name,
    COUNT(DISTINCT a.child_id) as total_children,
    COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count,
    COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count,
    COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present
  FROM attendance a
  LEFT JOIN classes c ON a.class_id = c.id
  WHERE a.attendance_date = p_date
  GROUP BY a.attendance_date, c.id, c.name;
END;
$$;
--;;

-- 2. get_liability_audit_report (Required for Forensic Audit Suite)
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
    duration_hours NUMERIC
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
        END as duration_hours
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
--;;

-- 3. get_staff_performance_stats (Required for Team Insights)
CREATE OR REPLACE FUNCTION public.get_staff_performance_stats(start_date DATE, end_date DATE)
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
--;;

-- 4. get_attendance_growth_stats (Required for Growth Analytics)
CREATE OR REPLACE FUNCTION public.get_attendance_growth_stats()
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
--;;

-- 5. get_users_with_roles (Fixed for Production Profile Schema)
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  created_at timestamptz,
  address text,
  city text,
  state text,
  zip text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  children_count integer,
  supervisor_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
    SELECT 
      p.id,
      p.email::text,
      COALESCE(p.first_name, '')::text,
      COALESCE(p.last_name, '')::text,
      COALESCE(p.phone, '')::text,
      ur.role::text,
      COALESCE(ur.is_super_admin, false),
      COALESCE(ur.is_volunteer, false),
      true AS is_active,
      p.created_at,
      p.address::text,
      p.city::text,
      p.state::text,
      p.zip_code::text as zip,
      p.gender::text,
      p.occupation::text,
      p.emergency_contact_name::text,
      p.emergency_contact_phone::text,
      (SELECT count(*)::integer FROM public.children c WHERE c.parent_id = p.id) as children_count,
      p.supervisor_id::uuid
    FROM 
      public.profiles p
    LEFT JOIN 
      public.user_roles ur ON p.id = ur.user_id
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$function$;
--;;
