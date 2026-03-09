
-- Migration: Enforce 300KB file size limit and improve staff verification UX
-- Date: 2026-03-09

-- 1. Update storage bucket limit to 300KB (307200 bytes)
UPDATE storage.buckets 
SET file_size_limit = 307200,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
WHERE id = 'staff-documents';

-- 2. Ensure staff can update their own verification status correctly
-- We'll simplify the policy to be more reliable
DROP POLICY IF EXISTS "staff_update_own_verification_status" ON public.user_roles;
CREATE POLICY "staff_update_own_verification_status"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  -- We allow them to update verification_status, but we rely on the application to not change other sensitive fields.
  -- RLS is row-level, so they can technically update other fields if they are in the same row.
  -- But we'll trust the TypeScript client here for now, or we could add a trigger to enforce IMMUTABILITY of 'role'.
);

-- 3. Add a trigger to prevent staff from changing their own role via the above policy
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If not super admin, then role and is_super_admin must not change
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'super_admin' OR ur.is_super_admin = true)
    )
  ) THEN
    NEW.role := OLD.role;
    NEW.is_super_admin := OLD.is_super_admin;
    NEW.user_id := OLD.user_id; -- Prevent ownership change
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_user_role ON public.user_roles;
CREATE TRIGGER tr_protect_user_role
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_role();
