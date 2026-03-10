-- =====================================================================
-- FINAL ACCESS FIX FOR ADMINS AND TEACHERS
-- =====================================================================

-- ── 1. Create Helper Function First (to avoid "does not exist" errors) ──
CREATE OR REPLACE FUNCTION public.child_id_assigned_to_user(p_child_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.children c
        JOIN public.teachers t ON c.class_id = t.class_id
        WHERE c.id = p_child_id 
          AND t.user_id = p_user_id
          AND c.class_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 2. Fix Teachers Table Access ──
-- First, ensure RLS is enabled
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Drop generic select-all policy if it exists (it's too broad)
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;

-- Admin: full access to manage staff assignments
CREATE POLICY "teachers_admin_all"
    ON public.teachers FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Staff/Teachers: can see who is assigned to classes (needed for dashboard to load class rosters)
CREATE POLICY "teachers_view_all"
    ON public.teachers FOR SELECT TO authenticated
    USING (true);

-- ── 3. Fix Children Access for Staff/Admins ──

-- Ensure children policies are robust
DROP POLICY IF EXISTS "children_admin_all" ON public.children;
CREATE POLICY "children_admin_all"
    ON public.children FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Re-defining the staff class select to be more reliable
DROP POLICY IF EXISTS "children_staff_assigned_select" ON public.children;
DROP POLICY IF EXISTS "children_staff_class_select" ON public.children;
DROP POLICY IF EXISTS "children_staff_class" ON public.children;

CREATE POLICY "children_staff_assigned_select"
    ON public.children FOR SELECT TO authenticated
    USING (
        -- Is the user a staff member?
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer','admin','super_admin')
        )
        AND (
            -- Case A: User is Admin (already covered by children_admin_all, but for safety in SELECT)
            public.is_admin_secure()
            OR 
            -- Case B: User is assigned to this child's class
            child_id_assigned_to_user(id, auth.uid())
        )
    );
