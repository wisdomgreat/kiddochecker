-- 🛡️ Security Sweep & Access Control Strengthening
-- Description: Seeding church permissions, hardening organization_settings, and fixing interaction policies.

-- 1. Ensure new permissions exist
INSERT INTO public.permissions (name, description, category) VALUES
('church_view', 'View the church management dashboard and member profiles', 'church'),
('church_manage_members', 'Add, edit, and onboard formal members and visitors', 'church'),
('church_manage_ministries', 'Create and manage departments and small groups', 'church')
ON CONFLICT (name) DO NOTHING;

-- 2. Harden organization_settings RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view organization settings" ON public.organization_settings;
CREATE POLICY "Anyone can view organization settings" 
ON public.organization_settings FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Only admins can manage settings" ON public.organization_settings;
CREATE POLICY "Only admins can manage settings" 
ON public.organization_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  )
);

-- 3. Refine visitor_interactions RLS
DROP POLICY IF EXISTS "Admins can manage all interactions" ON public.visitor_interactions;
CREATE POLICY "Permission-based interaction access" 
ON public.visitor_interactions FOR ALL 
TO authenticated 
USING (
  public.has_permission(auth.uid(), 'church_view') OR 
  public.has_permission(auth.uid(), 'church_manage_members')
);

-- 4. Ensure profiles RLS lets staff see member profiles
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  public.has_permission(auth.uid(), 'church_view') OR 
  (auth.uid() = id)
);

-- 5. Harden all SECURITY DEFINER functions with search_path
ALTER FUNCTION public.has_permission(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.is_admin_secure() SET search_path = public;
ALTER FUNCTION public.get_staff_members() SET search_path = public;
