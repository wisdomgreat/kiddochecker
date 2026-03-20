-- 🗃️ Visitor CRM & Email Automation (FIXED)
-- Description: Adds tables to track visitor interactions and seeds follow-up email templates with JSONB placeholders.

-- 1. Create visitor_interactions table
CREATE TABLE IF NOT EXISTS public.visitor_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_type TEXT CHECK (interaction_type IN ('email', 'phone', 'text', 'note', 'meeting')),
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for visitor_interactions
CREATE POLICY "Admins can manage all interactions" 
ON public.visitor_interactions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  )
);

-- 2. Seed Email Templates for CRM
INSERT INTO public.email_templates (name, subject, body_html, description, placeholders)
VALUES 
(
  'visitor_welcome', 
  'Welcome to {{churchName}}! 🏛️', 
  '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Welcome Home, {{visitorName}}!</h1>
    <p>It was such a joy to have you with us at <strong>{{churchName}}</strong>.</p>
    <p>We hope you felt the warmth of our community and the presence of God. If you have any questions or would like to learn more about our ministries, feel free to reply to this email.</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Join us again:</strong> Next Sunday at 10:00 AM</p>
    </div>
    <p>God bless,</p>
    <p>The {{churchName}} Team</p>
  </div>', 
  'Sent to first-time visitors after their initial visit.', 
  '["visitorName", "churchName"]'::jsonb
),
(
  'visitor_followup_missing', 
  'We Missed You! 🕊️', 
  '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Hi {{visitorName}},</h1>
    <p>We missed seeing you this weekend! We were thinking about you and wanted to check in.</p>
    <p>If there is anything we can pray for or any way we can support you, please don''t hesitate to reach out.</p>
    <p>Hope to see you soon!</p>
    <p>In Christ,</p>
    <p>The Pastoral Team</p>
  </div>', 
  'Sent when a visitor hasn''t returned for a follow-up week.', 
  '["visitorName"]'::jsonb
),
(
  'visitor_membership_invite', 
  'Taking the Next Step at {{churchName}} 🚶‍♂️', 
  '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Next Steps...</h1>
    <p>Hi {{visitorName}}, you''ve been a part of our community for a while now, and we''d love to invite you to our <strong>New Members Breakfast</strong>.</p>
    <p>This is a great chance to hear the vision of {{churchName}}, meet the staff, and find out how you can get plugged in.</p>
    <a href="{{inviteLink}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">RSVP Today</a>
    <p>Blessings,</p>
    <p>Member Relations</p>
  </div>', 
  'Invite regular visitors to become official church members.', 
  '["visitorName", "churchName", "inviteLink"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET 
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  placeholders = EXCLUDED.placeholders;
