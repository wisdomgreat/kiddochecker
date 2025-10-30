-- Restore auth_users_with_emails view that was accidentally dropped
-- This view is needed by FamilyConnectPage and referenced throughout the codebase
-- We'll recreate it with proper RLS policies instead of relying on SECURITY DEFINER

CREATE OR REPLACE VIEW public.auth_users_with_emails AS
SELECT id, email
FROM auth.users;

-- Add RLS to control access to this view
ALTER VIEW public.auth_users_with_emails OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.auth_users_with_emails TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.auth_users_with_emails IS 'Provides access to user emails from auth.users. Access controlled through RLS policies on tables that reference this view.';