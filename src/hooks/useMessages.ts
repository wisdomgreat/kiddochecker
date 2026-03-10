import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  recipient_role?: string;
  is_broadcast?: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name?: string;
    last_name?: string;
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

        // Filter messages based on user role for broadcasts
        // Since Supabase RLS handles this, we only need to filter if there's any ambiguity,
        // but it's cleaner to let the DB handle it via the select. 
        // We've updated RLS, so 'messagesData' already contains only allowed messages.

        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds);

        const { data: receipts } = await supabase
          .from('message_read_receipts' as any)
          .select('message_id' as any)
          .eq('user_id', user.id) as any;

        const messagesWithSenders = messagesData.map(message => ({
          ...message,
          is_read: message.is_read || receipts?.some((r: any) => r.message_id === message.id) || false,
          sender: profiles?.find(profile => profile.id === message.sender_id) || undefined
        }));

        return messagesWithSenders;
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
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: messageData.subject,
          content: messageData.content,
          recipient_id: messageData.recipient_id || null,
          recipient_role: messageData.recipient_role || null,
          is_broadcast: !!messageData.recipient_role
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
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

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
  };
};

export default useMessages;
