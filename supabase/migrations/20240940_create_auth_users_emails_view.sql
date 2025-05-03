
-- Create a view to safely expose email addresses
CREATE OR REPLACE VIEW auth_users_emails_view AS 
SELECT 
  au.id,
  au.email
FROM 
  auth.users au
JOIN 
  public.user_roles ur ON au.id = ur.user_id
WHERE 
  ur.role IN ('admin', 'super_admin') OR ur.is_super_admin = true
  OR au.id = auth.uid();

-- Add RLS policy to the view to control access
ALTER TABLE auth_users_emails_view ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to access this view
CREATE POLICY "Allow authenticated access to emails view" 
  ON auth_users_emails_view 
  FOR SELECT 
  TO authenticated 
  USING (true);
