
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  description: string;
  placeholders: string[];
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .update({
          subject: template.subject,
          body_html: template.body_html,
          description: template.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
  };
};

