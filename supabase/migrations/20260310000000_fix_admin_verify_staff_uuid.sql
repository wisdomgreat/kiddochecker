-- ============================================================
-- Migration: Fix admin_verify_staff UUID issue
-- ============================================================

-- Function to approve/reject staff verification (FIX UUID casting)
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

    -- Log this action (FIX: Use p_user_id directly, not p_user_id::TEXT for a UUID column)
    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'verify_staff', 'user_roles', p_user_id, 
      jsonb_build_object('action', 'approved', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'verified');

  ELSIF p_action = 'reject' THEN
    UPDATE public.user_roles 
    SET verification_status = 'rejected',
        verified_by = v_admin_id,
        verification_notes = COALESCE(p_notes, 'Rejected by administrator')
    WHERE user_id = p_user_id;

    -- Log this action (FIX: Use p_user_id directly)
    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (v_admin_id, 'reject_staff', 'user_roles', p_user_id, 
      jsonb_build_object('action', 'rejected', 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;
