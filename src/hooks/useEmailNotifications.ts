
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailNotificationData {
  to: string;
  subject?: string;
  message?: string;
  templateName?: string;
  templateData?: Record<string, string>;
  type?: 'check_in' | 'check_out' | 'general' | 'weekly_report' | 'staff_onboarding' | 'staff_pin';
  childName?: string;
  className?: string;
  staffName?: string;
  pin?: string;
}

export const useEmailNotifications = () => {
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: EmailNotificationData) => {
      // Call the edge function for sending emails
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Notification email has been sent successfully",
      });
    },
    onError: (error: any) => {
      console.error("Email sending error:", error);
      toast({
        title: "Email failed",
        description: error.message || "Failed to send email notification",
        variant: "destructive",
      });
    },
  });

  const sendCheckInNotification = (parentEmail: string, childName: string, className: string) => {
    sendEmailMutation.mutate({
      to: parentEmail,
      templateName: 'check_in_notification',
      templateData: {
        childName,
        className,
      },
      type: 'check_in',
      childName,
      className,
    });
  };

  const sendCheckOutNotification = (parentEmail: string, childName: string, className: string) => {
    sendEmailMutation.mutate({
      to: parentEmail,
      templateName: 'check_out_notification',
      templateData: {
        childName,
        className,
      },
      type: 'check_out',
      childName,
      className,
    });
  };

  const sendStaffPinNotification = (email: string, staffName: string, pin: string) => {
    sendEmailMutation.mutate({
      to: email,
      templateName: 'staff_pin_reset',
      templateData: {
        staffName,
        pin,
      },
      type: 'staff_pin',
      staffName,
      pin,
    });
  };

  return {
    sendEmail: sendEmailMutation.mutate,
    sendCheckInNotification,
    sendCheckOutNotification,
    sendStaffPinNotification,
    isLoading: sendEmailMutation.isPending,
  };
};
