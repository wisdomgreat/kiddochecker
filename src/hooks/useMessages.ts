import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  recipient_role?: string;
  is_broadcast?: boolean;
  sent_via_sms?: boolean;
  sent_via_email?: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  };
  recipient?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  };
}

export const useMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id) return [];

      try {
        // Fetch base messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},recipient_role.not.is.null`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return [];
        }

        if (!messagesData || messagesData.length === 0) {
          return [];
        }

        // Get all unique user IDs involved (senders and recipients)
        const userIds = [...new Set([
          ...messagesData.map(msg => msg.sender_id),
          ...messagesData.filter(msg => msg.recipient_id).map(msg => msg.recipient_id!)
        ])];
        
        // Fetch profiles and roles in parallel
        const [profilesRes, rolesRes, receiptsRes] = await Promise.all([
          supabase.from('profiles').select('id, first_name, last_name').in('id', userIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
          supabase.from('message_read_receipts' as any).select('message_id' as any).eq('user_id', user.id) as any
        ]);

        const profiles = profilesRes.data || [];
        const roles = rolesRes.data || [];
        const receipts = receiptsRes.data || [];

        const messagesWithDetails = messagesData.map(message => {
          const senderProfile = profiles.find(p => p.id === message.sender_id);
          const senderRole = roles.find(r => r.user_id === message.sender_id);
          const recipientProfile = profiles.find(p => p.id === message.recipient_id);
          const recipientRoleDetail = roles.find(r => r.user_id === message.recipient_id);

          return {
            ...message,
            is_read: message.is_read || receipts?.some((r: any) => r.message_id === message.id) || false,
            sender: senderProfile ? {
              first_name: senderProfile.first_name,
              last_name: senderProfile.last_name,
              role: senderRole?.role
            } : undefined,
            recipient: recipientProfile ? {
              first_name: recipientProfile.first_name,
              last_name: recipientProfile.last_name,
              role: recipientRoleDetail?.role
            } : undefined
          };
        });

        return messagesWithDetails;
      } catch (error: any) {
        console.error("Error in useMessages:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      subject?: string;
      content: string;
      recipient_id?: string;
      recipient_role?: string;
      sent_via_sms?: boolean;
      sent_via_email?: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: messageData.subject || "No Subject",
          content: messageData.content,
          recipient_id: messageData.recipient_id || null,
          recipient_role: messageData.recipient_role || null,
          is_broadcast: !!messageData.recipient_role,
          sent_via_sms: messageData.sent_via_sms || false,
          sent_via_email: messageData.sent_via_email || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["parent-messages"] });
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (message: Message) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (message.recipient_id === user.id || !message.recipient_role) {
        // Direct message
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true } as any)
          .eq('id', message.id);
        if (error) throw error;
      } else {
        // Broadcast message (or role-based)
        const { error } = await supabase
          .from('message_read_receipts' as any)
          .upsert({ 
            message_id: message.id, 
            user_id: user.id,
            read_at: new Date().toISOString()
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const unreadCount = messages.filter(m => !m.is_read && m.sender_id !== user?.id).length;

  return {
    messages,
    isLoading,
    unreadCount,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
  };
};

export default useMessages;



