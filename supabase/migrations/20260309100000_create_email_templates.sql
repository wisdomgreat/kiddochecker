
-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    description TEXT,
    placeholders JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Super admins can manage email templates" 
    ON public.email_templates 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'super_admin' OR is_super_admin = true)
        )
    );

CREATE POLICY "Authenticated users can view email templates" 
    ON public.email_templates 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Seed default templates
INSERT INTO public.email_templates (name, subject, body_html, description, placeholders)
VALUES 
(
    'staff_onboarding', 
    'Welcome to KiddoChecker - Your Account is Ready!', 
    '<h1>Hello {{firstName}}!</h1><p>Your staff account for KiddoChecker has been created successfully.</p><p><strong>Your Temporary Credentials:</strong></p><ul><li>Email: {{email}}</li><li>Temporary Password: {{tempPassword}}</li></ul><p>Please log in at {{loginUrl}} and complete your registration wizard. You will be required to change your password upon first login.</p><p>Best regards,<br/>The Children''s Ministry Team</p>',
    'Sent to new staff members when their account is created by an admin.',
    '["firstName", "email", "tempPassword", "loginUrl"]'
),
(
    'check_in_notification', 
    '{{childName}} Checked In Successfully', 
    '<h1>Check-in Notification</h1><p>Hi there,</p><p>Your child, <strong>{{childName}}</strong>, has been checked in to <strong>{{className}}</strong> at {{time}}.</p><p>We hope they have a wonderful time!</p><p>Best regards,<br/>Children''s Ministry</p>',
    'Sent to parents when their child is checked in.',
    '["childName", "className", "time"]'
),
(
    'check_out_notification', 
    '{{childName}} Checked Out Successfully', 
    '<h1>Check-out Notification</h1><p>Hi there,</p><p>Your child, <strong>{{childName}}</strong>, has been checked out from <strong>{{className}}</strong> at {{time}}.</p><p>Thank you for joining us today!</p><p>Best regards,<br/>Children''s Ministry</p>',
    'Sent to parents when their child is checked out.',
    '["childName", "className", "time"]'
)
ON CONFLICT (name) DO UPDATE 
SET 
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    description = EXCLUDED.description,
    placeholders = EXCLUDED.placeholders,
    updated_at = now();
