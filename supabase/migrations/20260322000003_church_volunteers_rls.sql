-- ⛪ Upgrade Volunteer RLS to Permission-Based Access

-- 1. volunteer_roles
DROP POLICY IF EXISTS "Public authenticated can view volunteer roles" ON volunteer_roles;
DROP POLICY IF EXISTS "Admins can manage volunteer roles" ON volunteer_roles;

CREATE POLICY "Permission: View volunteer roles"
ON volunteer_roles FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

CREATE POLICY "Permission: Manage volunteer roles"
ON volunteer_roles FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_volunteers'));


-- 2. shifts (Church specific)
-- NOTE: We add to existing policies rather than dropping them to avoid breaking staff management
DROP POLICY IF EXISTS "Permission: View church shifts" ON public.shifts;
DROP POLICY IF EXISTS "Permission: Manage church shifts" ON public.shifts;

CREATE POLICY "Permission: View church shifts"
ON public.shifts FOR SELECT
TO authenticated
USING (
    (role_type = 'volunteer' AND public.has_permission(auth.uid(), 'church_view'))
);

CREATE POLICY "Permission: Manage church shifts"
ON public.shifts FOR ALL
TO authenticated
USING (
    (role_type = 'volunteer' AND public.has_permission(auth.uid(), 'church_manage_volunteers'))
);
