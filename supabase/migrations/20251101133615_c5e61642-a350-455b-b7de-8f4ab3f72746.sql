-- ============================================================================
-- Phase 2, Batch 2C: Fix Critical RLS Security Issues
-- ============================================================================

-- ============================================================================
-- 1. FIX PROFILES TABLE - Restrict sensitive data access
-- ============================================================================

-- Drop duplicate policies first
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_manage_all_profiles_secure" ON public.profiles;

-- Create consolidated, secure policies for profiles
-- Users can only view and update their OWN profile
CREATE POLICY "users_view_own_profile_secure"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own_profile_secure"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can view all profiles (for user management)
CREATE POLICY "admins_view_all_profiles_secure"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_secure());

-- Admins can update all profiles (for user management)
CREATE POLICY "admins_update_all_profiles_secure"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin_secure())
WITH CHECK (is_admin_secure());

-- Admins can insert profiles (for user creation)
CREATE POLICY "admins_insert_profiles_secure"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin_secure());

-- ============================================================================
-- 2. FIX CHILDREN TABLE - Restrict medical information access
-- ============================================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Parents can view own children" ON public.children;
DROP POLICY IF EXISTS "Parents can view their children" ON public.children;
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.children;
DROP POLICY IF EXISTS "staff_admin_view_all_children_secure" ON public.children;
DROP POLICY IF EXISTS "staff_admin_manage_all_children_secure" ON public.children;

-- Parents can view their own children (full access including medical info)
CREATE POLICY "parents_view_own_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
);

-- Teachers can only view children in their assigned classes (limited medical info)
-- For now, teachers get read-only access to their class children
CREATE POLICY "teachers_view_assigned_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  has_role_secure('teacher'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM teachers t
    JOIN attendance a ON a.class_id = t.class_id
    WHERE t.user_id = auth.uid()
    AND a.child_id = children.id
  )
);

-- Admins and staff can view all children
CREATE POLICY "admins_staff_view_all_children_secure"
ON public.children
FOR SELECT
TO authenticated
USING (
  is_admin_secure() 
  OR has_role_secure('staff'::app_role)
);

-- Parents can insert their own children
CREATE POLICY "parents_insert_own_children_secure"
ON public.children
FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

-- Parents can update their own children
CREATE POLICY "parents_update_own_children_secure"
ON public.children
FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
);

-- Parents can delete their own children
CREATE POLICY "parents_delete_own_children_secure"
ON public.children
FOR DELETE
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_children pc 
    WHERE pc.child_id = children.id 
    AND pc.parent_id = auth.uid()
  )
);

-- Admins and staff can manage all children
CREATE POLICY "admins_staff_manage_all_children_secure"
ON public.children
FOR ALL
TO authenticated
USING (is_admin_secure() OR has_role_secure('staff'::app_role))
WITH CHECK (is_admin_secure() OR has_role_secure('staff'::app_role));

-- ============================================================================
-- 3. FIX ATTENDANCE_SUMMARY VIEW - Add RLS
-- ============================================================================

-- Enable RLS on the attendance_summary view
ALTER VIEW public.attendance_summary SET (security_invoker = true);

-- Create a secure function to get attendance summary with proper filtering
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
  -- Admins and staff can see all class summaries
  IF is_admin_secure() OR has_role_secure('staff'::app_role) THEN
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
    RETURN;
  END IF;
  
  -- Teachers can only see their assigned class summaries
  IF has_role_secure('teacher'::app_role) THEN
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
    INNER JOIN teachers t ON t.class_id = c.id
    WHERE a.attendance_date = p_date
    AND t.user_id = auth.uid()
    GROUP BY a.attendance_date, c.id, c.name;
    RETURN;
  END IF;
  
  -- Parents can only see summaries for classes their children attend
  IF has_role_secure('parent'::app_role) THEN
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
    INNER JOIN children ch ON a.child_id = ch.id
    WHERE a.attendance_date = p_date
    AND (ch.parent_id = auth.uid() OR EXISTS (
      SELECT 1 FROM parent_children pc 
      WHERE pc.child_id = ch.id 
      AND pc.parent_id = auth.uid()
    ))
    GROUP BY a.attendance_date, c.id, c.name;
    RETURN;
  END IF;
  
  -- No access for other roles
  RETURN;
END;
$$;