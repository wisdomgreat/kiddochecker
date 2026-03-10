
-- Enhancement to Messages Table for Broadcast and Role-based Messaging
-- This allows admins to send broadcasts to categories of users without high-overhead duplication.

-- 1. Add new columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'recipient_role') THEN
        ALTER TABLE public.messages ADD COLUMN recipient_role TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_broadcast') THEN
        ALTER TABLE public.messages ADD COLUMN is_broadcast BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update RLS policies to allow role-based viewing
-- Drop old view policy to replace with improved version
DROP POLICY IF EXISTS "users_view_own_messages_secure" ON public.messages;

CREATE POLICY "users_view_own_messages_enhanced" 
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
          ur.role::text = messages.recipient_role -- Exact match
          OR (messages.recipient_role = 'all') -- Broadcast to everyone
          OR (messages.recipient_role = 'staff' AND ur.role::text IN ('staff', 'admin', 'super_admin'))
          OR (messages.recipient_role = 'parents' AND ur.role::text = 'parent')
          OR (messages.recipient_role = 'teachers' AND ur.role::text IN ('teacher', 'teacher_assistant'))
        )
      )
    )
  )
  OR public.is_admin_secure()
);

-- 3. Add index for performance on role-based filtering
CREATE INDEX IF NOT EXISTS idx_messages_recipient_role ON public.messages(recipient_role) WHERE recipient_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_is_broadcast ON public.messages(is_broadcast) WHERE is_broadcast = TRUE;
