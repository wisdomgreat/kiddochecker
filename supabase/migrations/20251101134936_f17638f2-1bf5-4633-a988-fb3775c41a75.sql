-- Phase 3 Batch 3A: Fix Remaining RLS Security Issues
-- Focus: Messages, Child Notes, QR Codes, Activity Logs, Staff Invitations, Parent Children

-- ============================================
-- 1. FIX MESSAGES TABLE RLS
-- ============================================
-- Current issue: Policies may not adequately restrict access to private messages
-- Solution: Ensure only sender, recipient, and admins can access messages

-- Drop existing policies
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- Create secure policies
CREATE POLICY "users_insert_own_messages_secure" 
ON messages FOR INSERT 
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "users_view_own_messages_secure" 
ON messages FOR SELECT 
TO authenticated
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid() 
  OR is_admin_secure()
);

CREATE POLICY "users_update_own_messages_secure" 
ON messages FOR UPDATE 
TO authenticated
USING (
  recipient_id = auth.uid() 
  OR sender_id = auth.uid() 
  OR is_admin_secure()
)
WITH CHECK (
  recipient_id = auth.uid() 
  OR sender_id = auth.uid() 
  OR is_admin_secure()
);

CREATE POLICY "admins_delete_messages_secure" 
ON messages FOR DELETE 
TO authenticated
USING (is_admin_secure());

-- ============================================
-- 2. FIX CHILD_NOTES TABLE RLS
-- ============================================
-- Current issue: Teacher observations may be accessible beyond authorized users
-- Solution: Restrict access to note creator, admins, staff, and parents (for non-private notes only)

-- Drop existing policy
DROP POLICY IF EXISTS "teachers_manage_child_notes" ON child_notes;

-- Create secure policies
CREATE POLICY "teachers_insert_own_notes_secure" 
ON child_notes FOR INSERT 
TO authenticated
WITH CHECK (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "teachers_view_own_notes_secure" 
ON child_notes FOR SELECT 
TO authenticated
USING (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
  OR (
    -- Parents can see non-private notes for their children
    has_role_secure('parent'::app_role) 
    AND is_private = false 
    AND EXISTS (
      SELECT 1 FROM children c 
      WHERE c.id = child_notes.child_id 
      AND (
        c.parent_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM parent_children pc 
          WHERE pc.child_id = c.id 
          AND pc.parent_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "teachers_update_own_notes_secure" 
ON child_notes FOR UPDATE 
TO authenticated
USING (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "teachers_delete_own_notes_secure" 
ON child_notes FOR DELETE 
TO authenticated
USING (
  teacher_id = auth.uid() 
  OR has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

-- ============================================
-- 3. FIX QR_CODES TABLE RLS
-- ============================================
-- Current issue: QR codes could be stolen for unauthorized pickup
-- Solution: Restrict access to parents of the child, staff, and admins only

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can view their children's QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Staff can manage QR codes" ON qr_codes;

-- Create secure policies
CREATE POLICY "parents_view_own_children_qr_secure" 
ON qr_codes FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = qr_codes.child_id 
    AND (
      c.parent_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM parent_children pc 
        WHERE pc.child_id = c.id 
        AND pc.parent_id = auth.uid()
      )
    )
  )
  OR has_role_secure('admin'::app_role)
  OR has_role_secure('staff'::app_role)
  OR has_role_secure('teacher'::app_role)
);

CREATE POLICY "staff_manage_qr_codes_secure" 
ON qr_codes FOR ALL 
TO authenticated
USING (
  has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  has_role_secure('admin'::app_role) 
  OR has_role_secure('staff'::app_role)
);

-- ============================================
-- 4. FIX ACTIVITY_LOGS TABLE RLS
-- ============================================
-- Current issue: Activity logs reveal user behavior patterns
-- Solution: Restrict access to admins only

-- Drop existing policy
DROP POLICY IF EXISTS "admins_view_activity_logs" ON activity_logs;

-- Create secure policy
CREATE POLICY "admins_view_activity_logs_secure" 
ON activity_logs FOR SELECT 
TO authenticated
USING (is_admin_secure());

CREATE POLICY "admins_manage_activity_logs_secure" 
ON activity_logs FOR ALL 
TO authenticated
USING (is_admin_secure())
WITH CHECK (is_admin_secure());

-- ============================================
-- 5. FIX STAFF_INVITATIONS TABLE RLS
-- ============================================
-- Current issue: Staff email addresses and invitation tokens exposed
-- Solution: Restrict access to admins and the invited user only

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage staff invitations" ON staff_invitations;
DROP POLICY IF EXISTS "Staff can view their own invitation" ON staff_invitations;

-- Create secure policies
CREATE POLICY "admins_manage_staff_invitations_secure" 
ON staff_invitations FOR ALL 
TO authenticated
USING (is_admin_secure())
WITH CHECK (is_admin_secure());

CREATE POLICY "users_view_own_invitation_secure" 
ON staff_invitations FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR is_admin_secure()
);

-- ============================================
-- 6. FIX PARENT_CHILDREN TABLE RLS
-- ============================================
-- Current issue: Family relationships and pickup authorization exposed
-- Solution: Ensure only parents involved, admins, and staff can see relationships

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can create their relationships" ON parent_children;
DROP POLICY IF EXISTS "Parents can delete their relationships" ON parent_children;
DROP POLICY IF EXISTS "Parents can update their relationships" ON parent_children;
DROP POLICY IF EXISTS "Parents can view their relationships" ON parent_children;
DROP POLICY IF EXISTS "Users can insert their own parent_children relationships" ON parent_children;
DROP POLICY IF EXISTS "Users can view their own parent_children relationships" ON parent_children;

-- Create secure policies
CREATE POLICY "parents_view_own_relationships_secure" 
ON parent_children FOR SELECT 
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = parent_children.child_id 
    AND c.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_insert_own_relationships_secure" 
ON parent_children FOR INSERT 
TO authenticated
WITH CHECK (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "parents_update_own_relationships_secure" 
ON parent_children FOR UPDATE 
TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = parent_children.child_id 
    AND c.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM children c 
    WHERE c.id = parent_children.child_id 
    AND c.parent_id = auth.uid()
  )
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);

CREATE POLICY "admins_delete_relationships_secure" 
ON parent_children FOR DELETE 
TO authenticated
USING (
  parent_id = auth.uid()
  OR is_admin_secure()
  OR has_role_secure('staff'::app_role)
);