import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VisitorInteraction {
  id: string;
  visitor_id: string;
  interaction_type: 'email' | 'phone' | 'text' | 'note' | 'meeting';
  content: string;
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
        .select('*')
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

  return {
    interactions,
    isLoading,
    addInteraction: addInteraction.mutate,
    sendEmail: sendEmail.mutate,
    isSending: sendEmail.isPending
  };
};
