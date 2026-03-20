-- Allow users to manage their own church membership record
DROP POLICY IF EXISTS "Users can manage own membership" ON public.church_memberships;

CREATE POLICY "Users can insert own membership"
ON public.church_memberships FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own membership"
ON public.church_memberships FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
