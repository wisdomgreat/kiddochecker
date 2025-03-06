
-- Create a storage bucket for organization assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the organization_assets bucket
-- Allow public read access for all users
CREATE POLICY "Public Read Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'organization_assets');

-- Allow authenticated users to upload organization assets
CREATE POLICY "Authenticated User Upload Access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization_assets');

-- Allow authenticated users to update their own organization assets
CREATE POLICY "Authenticated User Update Access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'organization_assets' AND auth.uid() IN (
  SELECT created_by FROM public.organization_settings
));
