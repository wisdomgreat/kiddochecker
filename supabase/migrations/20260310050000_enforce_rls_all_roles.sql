-- =============================================================
-- Migration: Enforce strict role-based data access (CIA triad)
-- This migration:
--   1. Ensures class_id column exists on children
--   2. Drops ALL existing children/attendance/classes policies
--      and rebuilds them with proper role coverage
--   3. Restricts QR management (children table access covers it)
-- =============================================================

-- ── Step 1: Add class_id to children if not exists ──
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'children'
          AND column_name  = 'class_id'
    ) THEN
        ALTER TABLE public.children
            ADD COLUMN class_id UUID
            REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE public.children    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes     ENABLE ROW LEVEL SECURITY;

-- ╔══════════════════════════════════════════════════════╗
-- ║             CHILDREN — drop & rebuild                ║
-- ╚══════════════════════════════════════════════════════╝

-- Drop every known policy on children
DROP POLICY IF EXISTS "Admin can manage all children"                        ON public.children;
DROP POLICY IF EXISTS "Admins can view and edit all children"                ON public.children;
DROP POLICY IF EXISTS "Staff can view children in their assigned classes"    ON public.children;
DROP POLICY IF EXISTS "Parents can view their own children"                  ON public.children;
DROP POLICY IF EXISTS "Parents can insert their own children"                ON public.children;
DROP POLICY IF EXISTS "Parents can update their own children"                ON public.children;
DROP POLICY IF EXISTS "Admin can insert children"                            ON public.children;
DROP POLICY IF EXISTS "Admin can update children"                            ON public.children;
DROP POLICY IF EXISTS "Admin can delete children"                            ON public.children;
DROP POLICY IF EXISTS "Staff and teacher can view children"                  ON public.children;
DROP POLICY IF EXISTS "children_admin_all"                                   ON public.children;
DROP POLICY IF EXISTS "children_parent_own"                                  ON public.children;
DROP POLICY IF EXISTS "children_staff_class"                                 ON public.children;

-- Helper: returns true if the current user is admin/super_admin
-- (re-uses the existing is_admin_secure() function if available)

-- 1. Admins — full access
CREATE POLICY "children_admin_all"
    ON public.children FOR ALL
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- 2. Parents — own children only
CREATE POLICY "children_parent_own"
    ON public.children FOR ALL
    USING (
        parent_id = auth.uid()
    )
    WITH CHECK (
        parent_id = auth.uid()
    );

-- 3. Staff / Teacher / Teacher_assistant / Volunteer — ONLY children
--    assigned to a class that the current user is assigned to via `teachers`
CREATE POLICY "children_staff_class"
    ON public.children FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND (
            -- class_id must be in one of the user's assigned classes
            class_id IS NOT NULL
            AND class_id IN (
                SELECT t.class_id
                FROM public.teachers t
                WHERE t.user_id = auth.uid()
                  AND t.class_id IS NOT NULL
            )
        )
    );

-- ╔══════════════════════════════════════════════════════╗
-- ║             ATTENDANCE — drop & rebuild              ║
-- ╚══════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "Staff and admin can view all attendance"              ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance"                       ON public.attendance;
DROP POLICY IF EXISTS "Staff can view attendance for their assigned classes" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_all"                                 ON public.attendance;
DROP POLICY IF EXISTS "attendance_parent_own"                                ON public.attendance;
DROP POLICY IF EXISTS "attendance_staff_class"                               ON public.attendance;
DROP POLICY IF EXISTS "Parents can view their children attendance"           ON public.attendance;
DROP POLICY IF EXISTS "Admin and staff can manage attendance"                ON public.attendance;

-- Admin — full access
CREATE POLICY "attendance_admin_all"
    ON public.attendance FOR ALL
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Parents — own children's attendance
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = child_id
              AND c.parent_id = auth.uid()
        )
    );

-- Staff / Teacher / etc — only their assigned classes
CREATE POLICY "attendance_staff_class"
    ON public.attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND class_id IN (
            SELECT t.class_id
            FROM public.teachers t
            WHERE t.user_id = auth.uid()
              AND t.class_id IS NOT NULL
        )
    );

-- Staff can INSERT attendance for their classes (needed for kiosk via assigned device)
CREATE POLICY "attendance_staff_insert_class"
    ON public.attendance FOR INSERT
    WITH CHECK (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- Staff can UPDATE attendance for their classes
CREATE POLICY "attendance_staff_update_class"
    ON public.attendance FOR UPDATE
    USING (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- ╔══════════════════════════════════════════════════════╗
-- ║             CLASSES — drop & rebuild                 ║
-- ╚══════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "Staff and admin can manage classes"  ON public.classes;
DROP POLICY IF EXISTS "classes_admin_all"                   ON public.classes;
DROP POLICY IF EXISTS "classes_staff_view_assigned"         ON public.classes;

-- Admin — full CRUD
CREATE POLICY "classes_admin_all"
    ON public.classes FOR ALL
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Staff/Teacher — SELECT only their assigned classes
CREATE POLICY "classes_staff_view_assigned"
    ON public.classes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND id IN (
            SELECT t.class_id
            FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

-- ╔══════════════════════════════════════════════════════╗
-- ║  Auto-assign class by age trigger (idempotent)       ║
-- ╚══════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_class_id UUID;
BEGIN
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        SELECT id INTO v_class_id
        FROM public.classes
        WHERE age_range IS NOT NULL
          AND (
                (age_range LIKE '%-%'
                 AND NEW.age >= CAST(split_part(age_range, '-', 1) AS INTEGER)
                 AND NEW.age <= CAST(split_part(age_range, '-', 2) AS INTEGER))
              OR
                (age_range !~ '[a-zA-Z-]'
                 AND NEW.age = CAST(age_range AS INTEGER))
          )
        LIMIT 1;
        IF v_class_id IS NOT NULL THEN
            NEW.class_id := v_class_id;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_assign_class ON public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_class_by_age();
