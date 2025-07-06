
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
        // First get messages without the problematic join
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return [];
        }

        if (!messagesData || messagesData.length === 0) {
          return [];
        }

        // Get unique sender IDs
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        
        // Get sender profiles separately
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds);

        // Combine the data
        const messagesWithSenders = messagesData.map(message => ({
          ...message,
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
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: messageData.subject,
          content: messageData.content,
          recipient_id: messageData.recipient_id || null,
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

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};

export default useMessages;
