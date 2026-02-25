-- ============================================================
-- Migration: Staff Verification Workflow + App Improvements
-- Date: 2026-02-25
-- ============================================================

-- 1. STAFF VERIFICATION STATUS on user_roles
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' 
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'suspended')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- All existing staff/admin users should be auto-verified (grandfathered in)
UPDATE public.user_roles 
SET verification_status = 'verified', verified_at = NOW()
WHERE role IN ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant')
  AND verification_status = 'unverified';

-- Parents are always verified (they don't need document checks)
UPDATE public.user_roles 
SET verification_status = 'verified', verified_at = NOW()
WHERE role = 'parent' AND verification_status = 'unverified';


-- 2. STAFF DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'police_check', 'background_check', 'reference_letter', 
    'training_cert', 'first_aid_cert', 'medical_clearance', 
    'insurance', 'pastoral_reference', 'child_protection_cert', 'other'
  )),
  document_name TEXT NOT NULL,
  file_path TEXT, -- Supabase Storage path
  file_size INTEGER,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ, -- For documents that expire (e.g., first aid cert)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on staff_documents
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Staff can view their own documents
CREATE POLICY "staff_view_own_docs" ON public.staff_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Staff can insert their own documents
CREATE POLICY "staff_upload_own_docs" ON public.staff_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update document status (approve/reject)
CREATE POLICY "admins_manage_docs" ON public.staff_documents
  FOR ALL TO authenticated
  USING (is_admin_secure());


-- 3. DOCUMENT REQUIREMENTS TABLE (configurable by admin)
CREATE TABLE IF NOT EXISTS public.document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  required_for_roles TEXT[] DEFAULT ARRAY['staff', 'teacher', 'teacher_assistant'],
  is_mandatory BOOLEAN DEFAULT true,
  has_expiry BOOLEAN DEFAULT false,
  expiry_months INTEGER, -- how many months before it expires
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_requirements" ON public.document_requirements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_manage_requirements" ON public.document_requirements
  FOR ALL TO authenticated USING (is_admin_secure());

-- Seed default document requirements
INSERT INTO public.document_requirements (document_type, display_name, description, is_mandatory, has_expiry, expiry_months) VALUES
  ('police_check', 'Police/Criminal Record Check', 'A valid police background check or criminal record clearance. Must be less than 6 months old.', true, true, 12),
  ('child_protection_cert', 'Child Protection Training', 'Certificate of completion for child protection/safeguarding training.', true, true, 24),
  ('reference_letter', 'Pastoral/Character Reference', 'A reference letter from a pastor, church leader, or community leader.', true, false, NULL),
  ('first_aid_cert', 'First Aid Certificate', 'Valid first aid or CPR training certificate.', false, true, 24),
  ('training_cert', 'Relevant Training Certificate', 'Any relevant early childhood education or ministry training certificates.', false, false, NULL),
  ('medical_clearance', 'Medical Clearance', 'Medical clearance to work with children, if applicable.', false, true, 12)
ON CONFLICT DO NOTHING;


-- 4. MEDICAL PROFILES FOR CHILDREN (structured)
CREATE TABLE IF NOT EXISTS public.child_medical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE UNIQUE,
  blood_type TEXT,
  allergies JSONB DEFAULT '[]'::JSONB, -- [{type: 'food', name: 'peanuts', severity: 'severe', notes: '...'}]
  medications JSONB DEFAULT '[]'::JSONB, -- [{name: 'Inhaler', dosage: 'As needed', frequency: 'PRN', notes: '...'}]
  conditions JSONB DEFAULT '[]'::JSONB, -- [{name: 'Asthma', notes: '...', diagnosed_date: '...'}]
  dietary_restrictions TEXT,
  emergency_notes TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  last_physical_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.child_medical_profiles ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own child's medical profile
CREATE POLICY "parents_manage_own_child_medical" ON public.child_medical_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
    OR is_admin_secure()
    OR has_role_secure('staff'::app_role)
    OR has_role_secure('teacher'::app_role)
  );


-- 5. KIOSK SETTINGS (including PIN)
CREATE TABLE IF NOT EXISTS public.kiosk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_kiosk_settings" ON public.kiosk_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_manage_kiosk_settings" ON public.kiosk_settings
  FOR ALL TO authenticated USING (is_admin_secure());

-- Insert default kiosk settings
INSERT INTO public.kiosk_settings (setting_key, setting_value) VALUES
  ('require_pin', 'true'),
  ('kiosk_pin', '123456'),
  ('auto_print_nametag', 'true'),
  ('allow_self_checkout', 'false'),
  ('session_timeout_minutes', '30')
ON CONFLICT (setting_key) DO NOTHING;


-- 6. FUNCTIONS

-- Function to get staff verification status
CREATE OR REPLACE FUNCTION public.get_staff_verification_status(p_user_id UUID)
RETURNS TABLE(
  verification_status TEXT,
  verified_at TIMESTAMPTZ,
  total_required INTEGER,
  total_submitted INTEGER,
  total_approved INTEGER,
  total_rejected INTEGER,
  total_pending INTEGER,
  is_fully_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    WITH doc_stats AS (
      SELECT 
        COUNT(*) FILTER (WHERE sd.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE sd.status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE sd.status = 'pending') as pending_count,
        COUNT(*) as total_submitted
      FROM public.staff_documents sd
      WHERE sd.user_id = p_user_id
    ),
    required_count AS (
      SELECT COUNT(*) as total
      FROM public.document_requirements dr
      WHERE dr.is_mandatory = true
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = p_user_id 
            AND ur.role::TEXT = ANY(dr.required_for_roles)
        )
    )
    SELECT 
      ur.verification_status,
      ur.verified_at,
      rc.total::INTEGER as total_required,
      ds.total_submitted::INTEGER,
      ds.approved_count::INTEGER as total_approved,
      ds.rejected_count::INTEGER as total_rejected,
      ds.pending_count::INTEGER as total_pending,
      (ds.approved_count >= rc.total AND rc.total > 0) as is_fully_verified
    FROM public.user_roles ur
    CROSS JOIN doc_stats ds
    CROSS JOIN required_count rc
    WHERE ur.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_verification_status(UUID) TO authenticated;

-- Function to approve/reject staff verification
CREATE OR REPLACE FUNCTION public.admin_verify_staff(
  p_user_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  -- Check admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_admin_id 
    AND (role IN ('admin', 'super_admin') OR is_super_admin = true)
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.user_roles 
    SET verification_status = 'verified',
        verified_at = NOW(),
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Approved by administrator')
    WHERE user_id = p_user_id;

    -- Log this action
    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'verify_staff', 'user_roles', p_user_id::TEXT, 
      jsonb_build_object('action', 'approved', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'verified');

  ELSIF p_action = 'reject' THEN
    UPDATE public.user_roles 
    SET verification_status = 'rejected',
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Rejected by administrator')
    WHERE user_id = p_user_id;

    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'reject_staff', 'user_roles', p_user_id::TEXT, 
      jsonb_build_object('action', 'rejected', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_staff(UUID, TEXT, TEXT) TO authenticated;

-- Function to get pending staff verifications for admin dashboard
CREATE OR REPLACE FUNCTION public.get_pending_staff_verifications()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  verification_status TEXT,
  created_at TIMESTAMPTZ,
  documents_submitted BIGINT,
  documents_approved BIGINT,
  documents_pending BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT,
      COALESCE(p.last_name, '')::TEXT,
      ur.role::TEXT,
      ur.verification_status,
      ur.created_at,
      (SELECT COUNT(*) FROM public.staff_documents sd WHERE sd.user_id = ur.user_id),
      (SELECT COUNT(*) FROM public.staff_documents sd WHERE sd.user_id = ur.user_id AND sd.status = 'approved'),
      (SELECT COUNT(*) FROM public.staff_documents sd WHERE sd.user_id = ur.user_id AND sd.status = 'pending')
    FROM public.user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role::TEXT IN ('staff', 'teacher', 'teacher_assistant')
      AND ur.verification_status IN ('unverified', 'pending', 'rejected')
    ORDER BY ur.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_staff_verifications() TO authenticated;

-- Update the get_staff_members function to only return VERIFIED staff
DROP FUNCTION IF EXISTS public.get_staff_members();

CREATE OR REPLACE FUNCTION public.get_staff_members()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  role text,
  is_super_admin boolean,
  is_volunteer boolean,
  is_active boolean,
  verification_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      ur.user_id,
      au.email::TEXT,
      COALESCE(p.first_name, '')::TEXT as first_name,
      COALESCE(p.last_name, '')::TEXT as last_name,
      COALESCE(p.phone, '')::TEXT as phone,
      ur.role::TEXT,
      COALESCE(ur.is_super_admin, false) as is_super_admin,
      COALESCE(ur.is_volunteer, false) as is_volunteer,
      (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL) AS is_active,
      COALESCE(ur.verification_status, 'unverified')::TEXT as verification_status
    FROM 
      public.user_roles ur
    JOIN 
      auth.users au ON ur.user_id = au.id
    LEFT JOIN 
      public.profiles p ON p.id = ur.user_id
    WHERE 
      ur.role::TEXT IN ('admin', 'staff', 'teacher', 'teacher_assistant', 'super_admin')
    ORDER BY 
      p.last_name NULLS LAST, p.first_name NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_members() TO service_role;

-- 7. Create Supabase Storage bucket for staff documents (done via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents', 
  'staff-documents', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff documents
CREATE POLICY "staff_upload_own_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'staff-documents' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "staff_view_own_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'staff-documents' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (ur.role IN ('admin', 'super_admin') OR ur.is_super_admin = true)
      )
    )
  );

CREATE POLICY "admins_manage_all_files" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'staff-documents' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role IN ('admin', 'super_admin') OR ur.is_super_admin = true)
    )
  );
