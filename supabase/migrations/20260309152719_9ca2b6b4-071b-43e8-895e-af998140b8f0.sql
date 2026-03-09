-- Allow staff to update their own verification_status (only that column)
CREATE POLICY "staff_update_own_verification_status"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
  AND is_super_admin = (SELECT ur.is_super_admin FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
);

-- Allow staff to update their own files in staff-documents bucket
CREATE POLICY "staff_update_own_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow staff to delete their own files in staff-documents bucket
CREATE POLICY "staff_delete_own_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::text);