-- =====================================================================
-- NUCLEAR RLS REBUILD — drop every single policy on children,
-- attendance, and classes, then create exactly the ones we need.
-- This guarantees no leftover permissive policies.
-- =====================================================================

-- ── Step 0: Ensure class_id column exists ──────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'children'
          AND column_name  = 'class_id'
    ) THEN
        ALTER TABLE public.children
            ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ── Step 1: Dynamically drop EVERY policy on the 3 tables ──────────
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('children', 'attendance', 'classes')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- ── Step 2: Enable RLS ─────────────────────────────────────────────
ALTER TABLE public.children   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes    ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (extra safety)
ALTER TABLE public.children   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.classes    FORCE ROW LEVEL SECURITY;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║               CHILDREN TABLE POLICIES                     ║
-- ╚═══════════════════════════════════════════════════════════╝

-- Admin / super_admin: full CRUD
CREATE POLICY "children_admin_all"
    ON public.children FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Parent: own children only
CREATE POLICY "children_parent_own"
    ON public.children FOR ALL TO authenticated
    USING      (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

-- Staff/Teacher/Assistant/Volunteer: SELECT only, class-scoped
CREATE POLICY "children_staff_class_select"
    ON public.children FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND class_id IS NOT NULL
        AND class_id IN (
            SELECT t.class_id FROM public.teachers t
            WHERE t.user_id = auth.uid() AND t.class_id IS NOT NULL
        )
    );

-- ╔═══════════════════════════════════════════════════════════╗
-- ║             ATTENDANCE TABLE POLICIES                     ║
-- ╚═══════════════════════════════════════════════════════════╝

-- Admin: full CRUD
CREATE POLICY "attendance_admin_all"
    ON public.attendance FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Parent: SELECT own children attendance
CREATE POLICY "attendance_parent_own"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = child_id AND c.parent_id = auth.uid()
        )
    );

-- Staff: SELECT attendance for classes they're assigned to
CREATE POLICY "attendance_staff_class_select"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND class_id IN (
            SELECT t.class_id FROM public.teachers t
            WHERE t.user_id = auth.uid() AND t.class_id IS NOT NULL
        )
    );

-- Staff: INSERT/UPDATE attendance for their classes
CREATE POLICY "attendance_staff_write"
    ON public.attendance FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "attendance_staff_update"
    ON public.attendance FOR UPDATE TO authenticated
    USING (
        public.is_admin_secure()
        OR class_id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- ╔═══════════════════════════════════════════════════════════╗
-- ║              CLASSES TABLE POLICIES                       ║
-- ╚═══════════════════════════════════════════════════════════╝

-- Admin: full CRUD
CREATE POLICY "classes_admin_all"
    ON public.classes FOR ALL TO authenticated
    USING      (public.is_admin_secure())
    WITH CHECK (public.is_admin_secure());

-- Staff/Teacher: SELECT only their assigned classes
CREATE POLICY "classes_staff_view_assigned"
    ON public.classes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('staff','teacher','teacher_assistant','volunteer')
        )
        AND id IN (
            SELECT t.class_id FROM public.teachers t WHERE t.user_id = auth.uid()
        )
    );

-- ╔═══════════════════════════════════════════════════════════╗
-- ║            AUTO-ASSIGN TRIGGER (idempotent)               ║
-- ╚═══════════════════════════════════════════════════════════╝

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
