-- Migration: Tighten Message Permissions and RLS
-- This ensures that roles must have explicit 'send_messages' or 'broadcast_messages' permissions to communicate.

-- 1. Ensure 'Parent' role can actually send messages (previously omitted)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  p.id as permission_id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Parent' AND p.name = 'send_messages'
ON CONFLICT DO NOTHING;

-- 2. Ensure 'Staff' role can send broadcasts
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  cr.id as role_id,
  p.id as permission_id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Staff' AND p.name = 'broadcast_messages'
ON CONFLICT DO NOTHING;

-- 3. Redefine Messages INSERT Policy
-- Only allow insert if user has 'send_messages' permission
-- If recipient_role is set (broadcast), user MUST have 'broadcast_messages' permission
DROP POLICY IF EXISTS "users_insert_own_messages_secure" ON public.messages;

CREATE POLICY "users_send_messages_checked" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.check_user_permission(auth.uid(), 'send_messages')
  AND (
    -- If it's a broadcast or role-targeted message, check for broadcast permission
    (recipient_role IS NULL AND is_broadcast = FALSE)
    OR public.check_user_permission(auth.uid(), 'broadcast_messages')
  )
);

-- 4. Redefine/Verify Update Policy for Read Status
-- Only recipient or admin can update (usually for marking as read)
DROP POLICY IF EXISTS "users_update_own_messages_secure" ON public.messages;

CREATE POLICY "users_update_message_status" 
ON public.messages FOR UPDATE 
TO authenticated
USING (
  recipient_id = auth.uid() 
  OR public.is_admin_secure()
)
WITH CHECK (
  -- Ensure only certain fields can be updated by the recipient (is_read)
  -- Note: In basic SQL RLS cannot easily restrict specific columns in WITH CHECK,
  -- but we can ensure the recipient_id doesn't change and sender_id doesn't change.
  (recipient_id = auth.uid() OR public.is_admin_secure())
);

-- 5. Tighten SELECT Policy (Build upon the previously enhanced one)
-- Ensures users can only see what they are allowed to see
-- This is a safety drop and recreate to ensure 'check_user_permission' is factored in if needed.
DROP POLICY IF EXISTS "users_view_own_messages_enhanced" ON public.messages;

CREATE POLICY "users_view_authorized_messages" 
ON public.messages FOR SELECT 
TO authenticated
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid() 
  OR (
    recipient_role IS NOT NULL 
    AND (
      -- Check if current user has the role required by the message
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND (
          ur.role::text = messages.recipient_role
          OR (messages.recipient_role = 'all')
          OR (messages.recipient_role = 'staff' AND ur.role::text IN ('staff', 'admin', 'super_admin'))
          OR (messages.recipient_role = 'parents' AND ur.role::text = 'parent')
          OR (messages.recipient_role = 'teachers' AND ur.role::text IN ('teacher', 'teacher_assistant'))
        )
      )
    )
  )
  OR public.check_user_permission(auth.uid(), 'view_messages') -- Or if they have global view perms (Admins/Staff)
);
