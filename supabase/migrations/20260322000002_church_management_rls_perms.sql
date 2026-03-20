-- ⛪ Upgrade Church Management RLS to Permission-Based Access

-- 1. church_memberships
DROP POLICY IF EXISTS "Staff can view all church memberships" ON church_memberships;
DROP POLICY IF EXISTS "Church admins and staff can manage memberships" ON church_memberships;
DROP POLICY IF EXISTS "Users can view their own membership" ON church_memberships;

-- Users can always see their own record
CREATE POLICY "View own membership"
ON church_memberships FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Permission: View all memberships"
ON church_memberships FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

CREATE POLICY "Permission: Manage all memberships"
ON church_memberships FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_members'));


-- 2. ministries
DROP POLICY IF EXISTS "Public authenticated can see ministries" ON ministries;
DROP POLICY IF EXISTS "Admins can manage ministries" ON ministries;

CREATE POLICY "Permission: View ministries"
ON ministries FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

CREATE POLICY "Permission: Manage ministries"
ON ministries FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_ministries'));


-- 3. ministry_groups
DROP POLICY IF EXISTS "Public authenticated can see groups" ON ministry_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON ministry_groups;

CREATE POLICY "Permission: View groups"
ON ministry_groups FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

CREATE POLICY "Permission: Manage groups"
ON ministry_groups FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_ministries'));


-- 4. ministry_member_assignments (Connections between members and groups)
DROP POLICY IF EXISTS "Staff can see assignments" ON ministry_member_assignments;
DROP POLICY IF EXISTS "Staff can manage assignments" ON ministry_member_assignments;

CREATE POLICY "Permission: View assignments"
ON ministry_member_assignments FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'church_view'));

CREATE POLICY "Permission: Manage assignments"
ON ministry_member_assignments FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'church_manage_members') OR public.has_permission(auth.uid(), 'church_manage_ministries'));
