
-- 1. Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert Visitor Welcome Template
INSERT INTO public.email_templates (name, subject, body_html, description)
VALUES (
    'visitor_welcome',
    'Welcome to our family, {{firstName}}!',
    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #4f46e5; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">We''re Glad You''re Here!</h1>
        </div>
        
        <p style="font-size: 18px;">Hi <strong>{{firstName}}</strong>,</p>
        
        <p>It was such a joy having you visit us. At <strong>KiddoChecker Church</strong>, we believe every person who walks through our doors is a guest of honor.</p>
        
        <div style="background-color: #f8fafc; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #e2e8f0;">
            <h2 style="font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">What''s Next?</h2>
            <p style="margin: 0;">We''d love to get to know you better. If you have any prayer points or questions about our ministry, just reply to this email!</p>
        </div>

        <p>We have a special "New Members" orientation next Sunday. We''d love to see you there!</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #94a3b8; text-align: center;">
            <p>© 2026 KiddoChecker Church. All rights reserved.</p>
        </div>
    </div>',
    'The standard welcome email sent to first-time visitors.'
) ON CONFLICT (name) DO UPDATE SET 
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html;

-- 3. Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins can manage templates" ON public.email_templates
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Anyone authenticated can view templates" ON public.email_templates
    FOR SELECT TO authenticated USING (true);
