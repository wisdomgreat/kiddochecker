
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JourneyProgress {
  id: string;
  membership_id: string;
  current_step: number;
  journey_type: string;
}

const JOURNEY_STEPS: Record<string, any[]> = {
  visitor_welcome: [
    { name: 'visitor_welcome', delayDays: 0 },
    { name: 'visitor_followup_missing', delayDays: 7 },
    { name: 'visitor_membership_invite', delayDays: 7 },
  ]
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch active journeys that are due
    const { data: journeys, error: fetchError } = await supabaseAdmin
      .from("journey_progress")
      .select(`
        *,
        membership:church_memberships (
          profile:profiles (id, first_name, last_name, email)
        )
      `)
      .eq("status", "active")
      .lte("next_run_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    console.log(`Processing ${journeys?.length || 0} journeys.`);

    for (const journey of journeys || []) {
      const steps = JOURNEY_STEPS[journey.journey_type] || [];
      const currentStep = journey.current_step;
      const stepDef = steps[currentStep];

      if (!stepDef) {
        // Mark as completed
        await supabaseAdmin
          .from("journey_progress")
          .update({ status: "completed" })
          .eq("id", journey.id);
        continue;
      }

      const visitor = journey.membership.profile;
      
      console.log(`Executing step ${currentStep} (${stepDef.name}) for ${visitor.email || visitor.phone}`);

      // 2. Trigger Notifications
      try {
        // A. Email Channel
        if (visitor.email) {
            const { error: emailError } = await supabaseAdmin.functions.invoke("send-email", {
              body: {
                to: visitor.email,
                templateName: stepDef.name,
                templateData: {
                  visitorName: visitor.first_name,
                  churchName: "Green Valley Church",
                  inviteLink: `${Deno.env.get("PUBLIC_APP_URL") || 'http://localhost:5173'}/register`
                }
              }
            });

            if (emailError) {
                console.error(`Email send failed for ${visitor.email}:`, emailError);
            } else {
                await supabaseAdmin.from("visitor_interactions").insert({
                    visitor_id: visitor.id,
                    interaction_type: 'email',
                    content: `Automated Journey: Sent ${stepDef.name} email.`,
                    created_by: null
                });
            }
        }

        // B. SMS Channel (Optional fallback/complement)
        if (visitor.phone) {
            // Simple logic: send SMS for the first step (welcome)
            if (currentStep === 0) {
               const welcomeMessage = `Hi ${visitor.first_name}, thank you for visiting Green Valley Church today! We hope you enjoyed the service.`;
               const { error: smsError } = await supabaseAdmin.functions.invoke("send-sms", {
                 body: { to: visitor.phone, message: welcomeMessage }
               });

               if (!smsError) {
                   await supabaseAdmin.from("visitor_interactions").insert({
                       visitor_id: visitor.id,
                       interaction_type: 'text',
                       content: `Automated Journey: Sent welcome SMS.`,
                       created_by: null
                   });
               }
            }
        }
      } catch (e) {
        console.error("Critical error in notification step:", e);
      }

      // 3. Schedule next step or complete
      const nextStep = currentStep + 1;
      const hasNext = !!steps[nextStep];
      
      const updates: any = {
        current_step: nextStep,
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (hasNext) {
        const nextTime = new Date();
        nextTime.setDate(nextTime.getDate() + steps[nextStep].delayDays);
        updates.next_run_at = nextTime.toISOString();
      } else {
        updates.status = "completed";
      }

      await supabaseAdmin
        .from("journey_progress")
        .update(updates)
        .eq("id", journey.id);
    }

    return new Response(JSON.stringify({ success: true, processed: journeys?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in process-visitor-journeys:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
