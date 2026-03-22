
-- RLS REPAIR: Comprehensive access for Staff/Kiosk roles
-- Ensures identification (QR scans) works for all authorized roles.

-- 1. PROFILES: Allow all staff roles to SELECT for identification
DROP POLICY IF EXISTS "staff_view_profiles_for_id" ON public.profiles;
CREATE POLICY "staff_view_profiles_for_id"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  public.has_role_secure('kiosk'::app_role)
);

-- 2. CHILDREN: Ensure all staff roles can SELECT children (already handled but reinforcing)
DROP POLICY IF EXISTS "staff_view_children_for_id" ON public.children;
CREATE POLICY "staff_view_children_for_id"
ON public.children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() OR
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('teacher_assistant'::app_role) OR
  public.has_role_secure('kiosk'::app_role)
);

-- 3. QR_CODES: Allow staff to view tokens for lookups
DROP POLICY IF EXISTS "staff_view_qr_codes" ON public.qr_codes;
CREATE POLICY "staff_view_qr_codes"
ON public.qr_codes FOR SELECT
TO authenticated
USING (
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('teacher'::app_role) OR
  public.has_role_secure('kiosk'::app_role)
);

-- 4. CHURCH_MEMBERSHIPS: Ensure staff can see membership details (Visitors)
DROP POLICY IF EXISTS "staff_view_memberships" ON public.church_memberships;
CREATE POLICY "staff_view_memberships"
ON public.church_memberships FOR SELECT
TO authenticated
USING (
  public.is_admin_secure() OR 
  public.has_role_secure('staff'::app_role) OR 
  public.has_role_secure('kiosk'::app_role)
);

-- 5. Add profile_id to qr_codes to support non-child QR codes (Optional but good for future)
-- For now, let's just make sure existing child lookups work.
