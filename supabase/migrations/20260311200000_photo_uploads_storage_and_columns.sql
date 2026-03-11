-- Migration: 20260311200000_photo_uploads_storage_and_columns.sql

-- Add photo_url to children
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add avatar_url to profiles (if it doesn't already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create Storage Bucket for photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars bucket

-- Allow public read access to avatars
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar or children's photos
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'avatars'
);

-- Allow users to update their own uploads or we can just allow authenticated users for now
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING ( auth.uid() = owner AND bucket_id = 'avatars' );

