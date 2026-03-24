
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Ideally restricted to KIDDOCHECKER domain
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject?: string;
  message?: string;
  templateName?: string;
  templateData?: Record<string, string>;
  type?: string;
  childName?: string;
  className?: string;
}

// Simple HTML escaping to prevent injection
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Environment
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendKey || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      const missing = [];
      if (!resendKey) missing.push('RESEND_API_KEY');
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      console.error(`Missing critical environment variables: ${missing.join(', ')}`);
      return new Response(JSON.stringify({ 
        error: 'Server configuration error', 
        missing: missing 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract body early
    const body: EmailRequest = await req.json();
    const { to, subject, message, templateName, templateData, type, childName, className } = body;

    // 2. Authenticate the requester OR check if it's a allowed unauthenticated action
    const authHeader = req.headers.get('Authorization');
    const isAllowedUnauth = type === 'check_in' || type === 'check_out';

    if (!authHeader && !isAllowedUnauth) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a regular client to verify the user's identity
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { 
        headers: { 
          Authorization: authHeader || `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey
        } 
      },
      auth: { persistSession: false }
    });

    // Create an admin client for querying templates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user unless it's a kiosk action
    if (!isAllowedUnauth) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        console.error('User verification failed:', userError?.message || 'No user found');
        return new Response(JSON.stringify({ 
          error: 'Unauthorized', 
          details: userError?.message || 'Valid session required for this notification type',
          header_present: !!authHeader
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing "to" field' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let finalSubject = subject || '';
    let finalHtml = '';

    // 3. Handle Template vs Custom Message
    if (templateName) {
      console.log(`Using template: ${templateName}`);
      const { data: template, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .single();

      if (templateError || !template) {
        console.error(`Template ${templateName} not found:`, templateError);
      } else {
        finalSubject = template.subject;
        finalHtml = template.body_html;

        // Replace placeholders
        const data = { 
          ...templateData, 
          childName: childName || templateData?.childName || '',
          className: className || templateData?.className || '',
          time: new Date().toLocaleString()
        };

        for (const [key, value] of Object.entries(data)) {
          const placeholder = `{{${key}}}`;
          finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), String(value || ''));
          finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), String(value || ''));
        }
      }
    }

    // Special case for staff_pin_reset or visitor_welcome if template not in DB yet
    if (templateName === 'staff_pin_reset' && !finalHtml) {
      finalSubject = "Secret Staff Identity PIN - DO NOT SHARE";
      const staffName = templateData?.staffName || "Staff Member";
      const pin = templateData?.pin || "N/A";
      
      finalHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Identity PIN Assigned</h1>
          <p>Hello <strong>${escapeHtml(staffName)}</strong>,</p>
          <p>A new secure Identity PIN has been assigned to your profile for Kiosk authorization.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">YOUR IDENTITY PIN</p>
            <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; margin: 10px 0;">${escapeHtml(pin)}</p>
          </div>
          <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> Never share this code with anyone. It is uniquely tied to your identity.</p>
          <p>You can also view this PIN anytime by visiting your profile in the dashboard.</p>
        </div>
      `;
    }

    if (templateName === 'visitor_welcome' && !finalHtml) {
       finalSubject = `Welcome to ${templateData?.churchName || 'Green Valley Church'}!`;
       const visitorName = templateData?.visitorName || "Guest";
       finalHtml = `
          <div style="font-family: sans-serif; max-width: 600px; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; margin: 0 auto;">
            <h1 style="color: #6366f1; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 24px;">Welcome Home, ${escapeHtml(visitorName)}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">It was such a joy to have you with us today. We hope you felt the warmth of our community and the presence of God.</p>
            <div style="background: #f8fafc; padding: 24px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
              <p style="font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">JOIN US AGAIN</p>
              <p style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0;">Next Sunday at 10:00 AM</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 40px;">If there is anything we can pray for or if you would like to learn more about our ministries, simply reply to this email. We would love to connect with you.</p>
            <p style="font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">GOD BLESS,</p>
            <p style="font-size: 16px; font-weight: 800; color: #6366f1; margin: 0;">The ${escapeHtml(templateData?.churchName || 'Green Valley Church')} Team</p>
          </div>
       `;
    }

    if (!finalHtml && message) {
      const safeMessage = escapeHtml(message);
      const safeChildName = childName ? escapeHtml(childName) : '';
      const safeClassName = className ? escapeHtml(className) : '';
      
      finalSubject = subject || "Notification from Children's Ministry";
      finalHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4F46E5;">Children's Ministry</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${safeMessage.replace(/\n/g, '<br/>')}</p>
            
            ${safeChildName || safeClassName ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #d1d5db;">
                ${safeChildName ? `<p><strong>Child:</strong> ${safeChildName}</p>` : ''}
                ${safeClassName ? `<p><strong>Class:</strong> ${safeClassName}</p>` : ''}
              </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
              <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
              <strong>Time:</strong> ${new Date().toLocaleTimeString()}
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
            <p>This is an automated notification from the KiddoChecker system.</p>
            <p>© ${new Date().getFullYear()} KiddoChecker. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    if (!finalHtml) {
      return new Response(JSON.stringify({ error: 'No email content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Send email via Resend
    const sendingDomain = Deno.env.get("SENDING_DOMAIN") || "yourdomain.com";
    const emailResponse = await resend.emails.send({
      from: `KiddoChecker <noreply@${sendingDomain}>`,
      to: [to],
      subject: finalSubject,
      html: finalHtml,
    });

    console.log(`Email sent successfully. Unauth: ${isAllowedUnauth}, To: ${to}`);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
