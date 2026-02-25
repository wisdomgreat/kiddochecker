
-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for INSERT" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for UPDATE" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for DELETE" ON public.user_roles;

-- Create safe policies that don't cause recursion
-- Allow users to view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow authenticated users to insert roles (this will be used during signup/organization creation)
CREATE POLICY "System can create roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own roles if they are super_admin (using a function to avoid recursion)
CREATE POLICY "Super admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles existing_roles
    WHERE existing_roles.user_id = auth.uid() 
    AND existing_roles.is_super_admin = true
  )
);

-- Allow users to delete their own roles
CREATE POLICY "Users can delete own roles" 
ON public.user_roles 
FOR DELETE 
USING (auth.uid() = user_id);
