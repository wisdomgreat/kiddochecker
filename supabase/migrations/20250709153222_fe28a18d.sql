
-- Create staff_invitations table for managing staff invitation workflow
CREATE TABLE public.staff_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  invitation_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  user_id uuid REFERENCES auth.users(id) -- Set when staff completes signup
);

-- Add RLS policies for staff_invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can create, view, and manage invitations
CREATE POLICY "Admins can manage staff invitations" 
  ON public.staff_invitations 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view their own invitation (when they have the token)
CREATE POLICY "Staff can view their own invitation" 
  ON public.staff_invitations 
  FOR SELECT 
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_staff_invitations_updated_at
  BEFORE UPDATE ON public.staff_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(invitation_token);
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX idx_staff_invitations_status ON public.staff_invitations(status);
