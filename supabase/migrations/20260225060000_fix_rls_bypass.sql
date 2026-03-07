
-- Migration: Fix RLS bypass policies for user_roles and families
-- Date: 2026-02-25

-- 1. Drop the dangerous bypass policies
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "System functions bypass RLS for families" ON public.families;

-- 2. Implement proper RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

-- 3. Implement proper RLS for families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own families" 
ON public.families 
FOR SELECT 
TO authenticated 
USING (
  parent_id = auth.uid()
);

CREATE POLICY "Admins can view all families" 
ON public.families 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);

CREATE POLICY "Admins can manage all families" 
ON public.families 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.is_super_admin = true)
  )
);
