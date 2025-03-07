
-- Make sure all tables have RLS enabled but policies are more permissive for system functions

-- Functions need a special policy to bypass RLS when they're operating on behalf of the system
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "System functions can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "System functions can insert families" ON public.families;

-- Create a policy that allows system functions to manage user_roles
CREATE POLICY "System functions bypass RLS for user_roles" 
ON public.user_roles 
USING (true);

-- Create a policy that allows system functions to manage families
CREATE POLICY "System functions bypass RLS for families" 
ON public.families 
USING (true);

-- Fix organization_settings RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Set policy for organization_settings to be viewable by all authenticated users
CREATE POLICY "All authenticated users can view organization settings" 
ON public.organization_settings 
FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can update organization settings
CREATE POLICY "Only admins can update organization settings" 
ON public.organization_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin')
  )
);

-- Create storage bucket for organization assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to download from organization_assets
CREATE POLICY "Anyone can download from organization_assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization_assets');

-- Allow authenticated users to upload to organization_assets
CREATE POLICY "Authenticated users can upload organization assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization_assets');
