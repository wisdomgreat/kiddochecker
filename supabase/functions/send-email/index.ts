
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
  subject: string;
  message: string;
  type: string;
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate input and sanitize
    const body: EmailRequest = await req.json();
    const { to, subject, message, type, childName, className } = body;

    if (!to || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeMessage = escapeHtml(message);
    const safeSubject = escapeHtml(subject);
    const safeChildName = childName ? escapeHtml(childName) : '';
    const safeClassName = className ? escapeHtml(className) : '';

    // 3. Create HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
          Children's Ministry Notification
        </h2>
        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 16px; line-height: 1.5; color: #333;">${safeMessage}</p>
          ${safeChildName ? `<p><strong>Child:</strong> ${safeChildName}</p>` : ''}
          ${safeClassName ? `<p><strong>Class:</strong> ${safeClassName}</p>` : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated notification from the Children's Ministry Check-in System.</p>
        </div>
      </div>
    `;

    // 4. Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Children's Ministry <noreply@yourdomain.com>",
      to: [to],
      subject: safeSubject,
      html: htmlContent,
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
