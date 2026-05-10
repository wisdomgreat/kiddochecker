import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

export interface VisitorInteraction {
  id: string;
  visitor_id: string;
  interaction_type: 'email' | 'phone' | 'text' | 'note' | 'meeting';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
}

export const useVisitorInteractions = (visitorId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['visitor-interactions', visitorId],
    queryFn: async () => {
      if (!visitorId) return [];
      const { data, error } = await supabase
        .from('visitor_interactions')
        .select(`
          *,
          author:profiles!created_by (first_name, last_name)
        `)
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisitorInteraction[];
    },
    enabled: !!visitorId,
  });

  const addInteraction = useMutation({
    mutationFn: async (interaction: Partial<VisitorInteraction>) => {
      const { data, error } = await supabase
        .from('visitor_interactions')
        .insert([interaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-interactions', visitorId] });
      toast({ title: 'Logged', description: 'Interaction recorded successfully.' });
    },
  });

  const sendEmail = useMutation({
    mutationFn: async ({ to, templateName, templateData, visitor_id }: { to: string, templateName: string, templateData: any, visitor_id?: string }) => {
      if (!to) throw new Error("A valid email address is required.");
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, templateName, templateData },
      });

      if (error) throw error;
      
      // Also log it as an interaction
      await addInteraction.mutateAsync({
        visitor_id: visitor_id || visitorId,
        interaction_type: 'email',
        content: `Sent email: ${templateName}`,
      });

      return data;
    },
    onSuccess: () => {
      toast({ title: 'Email Sent', description: 'Follow-up email has been dispatched.' });
    },
    onError: (err: any) => {
      toast({ 
        title: 'Send Failed', 
        description: err.message || 'Check your Resend configuration.', 
        variant: 'destructive' 
      });
    }
  });

  const sendSMS = useMutation({
    mutationFn: async ({ to, message, visitor_id }: { to: string, message: string, visitor_id?: string }) => {
      if (!to) throw new Error("A valid phone number is required.");
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, message },
      });

      if (error) throw error;
      
      // Also log it as an interaction
      await addInteraction.mutateAsync({
        visitor_id: visitor_id || visitorId,
        interaction_type: 'text',
        content: `Sent SMS: ${message.substring(0, 50)}...`,
      });

      return data;
    },
    onSuccess: () => {
      toast({ title: 'SMS Sent', description: 'Text message has been sent successfully.' });
    },
    onError: (err: any) => {
      toast({ 
        title: 'SMS Failed', 
        description: err.message || 'Check your Twilio configuration.', 
        variant: 'destructive' 
      });
    }
  });

  const startVIPSeries = useMutation({
    mutationFn: async ({ membership_id, email, phone, firstName }: { membership_id: string, email?: string, phone?: string, firstName: string }) => {
      if (!email && !phone) {
        throw new Error("Cannot start journey: Both email and phone number are missing.");
      }

      let successCount = 0;

      // 1. Send the first email if available
      if (email) {
        try {
          await sendEmail.mutateAsync({
            to: email,
            templateName: 'visitor_welcome',
            templateData: { 
              visitorName: firstName,
              churchName: 'Green Valley Church'
            },
            visitor_id: visitorId
          });
          successCount++;
        } catch (e) {
          console.error("Email send failed during VIP start:", e);
        }
      }

      // 2. Send welcome SMS if phone available
      if (phone) {
        try {
          const welcomeMessage = `Hi ${firstName}, welcome to Green Valley Church! We were so happy to have you join our service today. We hope to see you again soon!`;
          await sendSMS.mutateAsync({
            to: phone,
            message: welcomeMessage,
            visitor_id: visitorId
          });
          successCount++;
        } catch (e) {
          console.error("SMS send failed during VIP start:", e);
        }
      }

      if (successCount === 0) {
        throw new Error("Failed to send welcome messages via all channels.");
      }

      // 3. Start the automated journey in Supabase
      const { error } = await supabase
        .from('journey_progress')
        .insert({
          membership_id,
          journey_type: 'visitor_welcome',
          status: 'active',
          current_step: 1, 
          next_run_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
        });

      if (error) throw error;

      // 4. Update journey stage to reflect movement
      await supabase
        .from('church_memberships')
        .update({ journey_stage: 'followed_up' })
        .eq('id', membership_id);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-interactions', visitorId] });
      queryClient.invalidateQueries({ queryKey: ['church-members'] });
      toast({ title: 'VIP Series Started', description: 'Automated welcome sequence is now active.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error Starting Series', description: err.message, variant: 'destructive' });
    }
  });

  return {
    interactions,
    isLoading,
    addInteraction: addInteraction.mutate,
    sendEmail: sendEmail.mutate,
    startVIPSeries: startVIPSeries.mutate,
    isSending: sendEmail.isPending || startVIPSeries.isPending
  };
};

