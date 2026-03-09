
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

    // 2. Authenticate the requester
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
          Authorization: authHeader,
          apikey: supabaseAnonKey
        } 
      },
      auth: {
        persistSession: false
      }
    });

    // Create an admin client for querying templates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User verification failed:', userError?.message || 'No user found');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: userError?.message,
        header_present: !!authHeader
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate input
    const body: EmailRequest = await req.json();
    const { to, subject, message, templateName, templateData, childName, className } = body;

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

    // Special case for staff_pin_reset if template not in DB yet
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

    console.log("Email sent successfully by user:", user.id);

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
