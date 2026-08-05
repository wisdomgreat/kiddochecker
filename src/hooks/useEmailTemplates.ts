
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
      try {
        const { data, error } = await (supabase as any)
          .from('email_templates')
          .select('*')
          .order('name');
        
        if (!error && data && data.length > 0) {
          return data as EmailTemplate[];
        }
      } catch (e) { }

      // Default system template fallback
      return [
        {
          id: 'tpl-1',
          name: 'Parent Check-in Confirmation',
          subject: 'KiddoChecker: Child Check-in Confirmation',
          body_html: '<p>Hello {{parent_name}},</p><p>Your child <strong>{{child_name}}</strong> has been successfully checked in to {{class_name}}.</p><p>Security PIN: <strong>{{pin}}</strong></p>',
          description: 'Sent to parents automatically when a child is checked in at the kiosk.',
          placeholders: ['parent_name', 'child_name', 'class_name', 'pin'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'tpl-2',
          name: 'Parent Pickup Verification',
          subject: 'KiddoChecker: Child Checkout Completed',
          body_html: '<p>Hello {{parent_name}},</p><p><strong>{{child_name}}</strong> was checked out by {{guardian_name}} at {{checkout_time}}.</p>',
          description: 'Sent to primary guardians when child is checked out.',
          placeholders: ['parent_name', 'child_name', 'guardian_name', 'checkout_time'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'tpl-3',
          name: 'Staff Shift Assignment',
          subject: 'KiddoChecker: New Shift Assignment Notification',
          body_html: '<p>Hello {{staff_name}},</p><p>You have been assigned to shift <strong>{{shift_name}}</strong> on {{shift_date}} from {{start_time}} to {{end_time}}.</p>',
          description: 'Sent to staff/teachers when scheduled on a shift roster.',
          placeholders: ['staff_name', 'shift_name', 'shift_date', 'start_time', 'end_time'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
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

