
-- Migration: Add Message Read Receipts for individual tracking (Broadcasts)
-- This allows each user to have their own 'read' status for broadcast messages.

-- 1. Create the receipts table
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "users_view_own_receipts" 
ON public.message_read_receipts FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_secure());

CREATE POLICY "users_insert_own_receipts" 
ON public.message_read_receipts FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id ON public.message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id ON public.message_read_receipts(message_id);

-- 5. Helper function to check if a broadcast is read by a user
CREATE OR REPLACE FUNCTION public.is_message_read(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- For direct messages, we can still check the is_read column if the user is the recipient
    -- But for broadcasts or for consistency, we'll check the receipts table first.
    RETURN EXISTS (
        SELECT 1 FROM public.message_read_receipts 
        WHERE message_id = p_message_id AND user_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.messages 
        WHERE id = p_message_id AND recipient_id = p_user_id AND is_read = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
