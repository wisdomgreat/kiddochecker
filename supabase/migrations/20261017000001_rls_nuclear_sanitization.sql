
-- ☢️ NUCLEAR REBUILD: Total RLS Sanitization
-- Migration: 20261017000001_rls_nuclear_sanitization.sql
-- Description: Dynamically drops ALL policies on core tables and rebuilds them using non-recursive logic.

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- 1. Drop EVERY policy on these tables to clear recursion and conflicts
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('user_roles', 'children', 'attendance', 'messages', 'profiles', 'organization_settings', 'kiosk_settings', 'teachers', 'classes')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- 2. Optimized Non-Recursive Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin') 
         OR (SELECT current_setting('role', true)) IN ('postgres', 'service_role');
END; $$;

CREATE OR REPLACE FUNCTION public.is_staff_secure()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer')
         OR (SELECT current_setting('role', true)) IN ('postgres', 'service_role');
END; $$;

-- 3. Core Table: user_roles (THE SOURCE OF RECURSION)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin_secure());

-- 4. Table: children
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "children_self_parent" ON public.children FOR ALL TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "children_admin" ON public.children FOR ALL TO authenticated USING (public.is_admin_secure());
CREATE POLICY "children_staff_view" ON public.children FOR SELECT TO authenticated USING (public.is_staff_secure());

-- 5. Table: attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_parent" ON public.attendance FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.children WHERE id = child_id AND parent_id = auth.uid()));
CREATE POLICY "attendance_admin" ON public.attendance FOR ALL TO authenticated USING (public.is_admin_secure());
CREATE POLICY "attendance_staff" ON public.attendance FOR ALL TO authenticated USING (public.is_staff_secure());

-- 6. Table: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_secure());
CREATE POLICY "profiles_staff_view" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff_secure());

-- 7. Table: messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_self" ON public.messages FOR ALL TO authenticated 
USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "messages_admin" ON public.messages FOR ALL TO authenticated USING (public.is_admin_secure());

-- 8. Table: organization_settings (Publicly readable for branding/config)
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_settings_read" ON public.organization_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_settings_admin" ON public.organization_settings FOR ALL TO authenticated USING (public.is_admin_secure());

-- 9. Table: kiosk_settings
ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kiosk_settings_read" ON public.kiosk_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "kiosk_settings_admin" ON public.kiosk_settings FOR ALL TO authenticated USING (public.is_admin_secure());
