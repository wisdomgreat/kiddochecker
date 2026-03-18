
-- Migration: enhance_rewards_system
-- Description: Add points_balance to public.children and update checkin_child to award points.

-- 1. Add points_balance to children table
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;

-- 2. Update existing checkin_child function to award points
CREATE OR REPLACE FUNCTION public.checkin_child(
  p_child_id uuid,
  p_class_id uuid DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL,
  p_qr_token text DEFAULT NULL,
  p_method text DEFAULT 'app_dashboard',
  p_station text DEFAULT NULL,
  p_special_instructions text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attendance_id uuid;
  today_date date := CURRENT_DATE;
  caller_id uuid := auth.uid();
  is_authorized boolean := false;
  points_to_award INTEGER := 5; -- Reward 5 points for each check-in
BEGIN
  -- 1. Authorization Check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = caller_id 
    AND role IN ('admin', 'super_admin', 'staff', 'teacher')
  ) THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id AND parent_id = caller_id
  ) THEN
    is_authorized := true;
  ELSIF p_qr_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM qr_codes
    WHERE child_id = p_child_id 
    AND qr_data = p_qr_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to check in this child';
  END IF;

  -- 2. Existence Check (Check if already checked in and NOT checked out)
  IF EXISTS (
    SELECT 1 FROM attendance 
    WHERE child_id = p_child_id 
    AND checked_out_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child is already checked in';
  END IF;

  -- 3. Update child points_balance
  UPDATE public.children 
  SET points_balance = COALESCE(points_balance, 0) + points_to_award
  WHERE id = p_child_id;

  -- 4. Insert record
  INSERT INTO attendance (
    child_id,
    class_id,
    checked_in_at,
    checked_in_by,
    attendance_date,
    checked_in_method,
    checked_in_station,
    special_instructions
  )
  VALUES (
    p_child_id,
    p_class_id,
    NOW(),
    COALESCE(p_checked_in_by, caller_id),
    today_date,
    p_method,
    p_station,
    p_special_instructions
  )
  RETURNING id INTO attendance_id;

  RETURN attendance_id;
END;
$function$;

-- 3. Create a function for parents to redeem rewards
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_child_id uuid,
  p_reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_points_required INTEGER;
  v_current_balance INTEGER;
  v_parent_id uuid;
  v_caller_id uuid := auth.uid();
BEGIN
  -- Check if reward exists and get points
  SELECT points INTO v_points_required FROM public.rewards WHERE id = p_reward_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found');
  END IF;

  -- Check if child belongs to caller (if not admin)
  SELECT parent_id, points_balance INTO v_parent_id, v_current_balance 
  FROM public.children WHERE id = p_child_id;
  
  IF v_parent_id != v_caller_id AND NOT public.is_admin_secure() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Check balance
  IF COALESCE(v_current_balance, 0) < v_points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  -- Deduct points
  UPDATE public.children 
  SET points_balance = points_balance - v_points_required
  WHERE id = p_child_id;

  -- Log redemption
  INSERT INTO public.reward_redemptions (reward_id, user_id, child_id, points_spent, status)
  VALUES (p_reward_id, v_caller_id, p_child_id, v_points_required, 'pending');

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Grant execute on redeem_reward
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid, uuid) TO authenticated;

-- 4. Function to update redemption status (Admin only)
CREATE OR REPLACE FUNCTION public.update_redemption_status(
  p_redemption_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin_secure() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE public.reward_redemptions 
  SET status = p_status
  WHERE id = p_redemption_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_redemption_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_child(uuid, uuid, uuid, text, text, text, text) TO authenticated, anon;
