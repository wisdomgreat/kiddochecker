-- Phase 2 Batch 2A: Replace auth_users_with_emails view with secure function
-- Create a secure function to fetch multiple user emails at once

CREATE OR REPLACE FUNCTION public.get_users_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to get emails
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  -- Admins can see all emails
  IF public.is_admin_secure() THEN
    RETURN QUERY
    SELECT au.id, au.email::text
    FROM auth.users au
    WHERE au.id = ANY(user_ids);
    RETURN;
  END IF;
  
  -- Regular users can only see emails of users they have interacted with
  -- (those who have sent/received messages from them)
  RETURN QUERY
  SELECT DISTINCT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids)
  AND (
    -- Users they've messaged
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE (m.sender_id = auth.uid() AND m.recipient_id = au.id)
         OR (m.recipient_id = auth.uid() AND m.sender_id = au.id)
    )
    -- Or staff/teachers (for parent communication)
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = au.id
      AND ur.role IN ('admin', 'staff', 'teacher', 'teacher_assistant')
    )
  );
END;
$$;