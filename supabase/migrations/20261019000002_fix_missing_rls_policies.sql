
-- 🛡️ Security Fix: Restore Missing RLS Policies
-- Migration: 20261019000002_fix_missing_rls_policies.sql
-- Description: Restores policies for classes and teachers tables that were dropped in a previous migration but not recreated.

-- 1. Table: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classes_read_all" ON public.classes;
CREATE POLICY "classes_read_all" ON public.classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "classes_admin" ON public.classes;
CREATE POLICY "classes_admin" ON public.classes FOR ALL TO authenticated USING (public.is_admin_secure());

-- 2. Table: teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_read_all" ON public.teachers;
CREATE POLICY "teachers_read_all" ON public.teachers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "teachers_admin" ON public.teachers;
CREATE POLICY "teachers_admin" ON public.teachers FOR ALL TO authenticated USING (public.is_admin_secure());
