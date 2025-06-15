
-- Create a security definer function to safely check if user is super admin
-- This function bypasses RLS policies to prevent recursion
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin 
     FROM public.user_roles 
     WHERE user_id = auth.uid() 
     LIMIT 1), 
    false
  );
$$;

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can create roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;

-- Create new, safe policies that won't cause recursion
-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow any authenticated user to insert roles (needed for organization creation)
CREATE POLICY "Authenticated users can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow super admins to manage all roles using the safe function
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_current_user_super_admin());

-- Allow users to update their own roles
CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own roles
CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
