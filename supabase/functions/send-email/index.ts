
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
    // 1. Authenticate the requester
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Create an admin client for querying templates if needed, or just use the user client
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
        // Fallback to custom message if possible
        if (!message) {
          return new Response(JSON.stringify({ error: `Template ${templateName} not found` }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
          finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), value || '');
          finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), value || '');
        }
      }
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
