
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
  recipient?: {
    first_name?: string;
    last_name?: string;
  };
}

export const useMessages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user) return [];

      try {
        // First get the messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          throw messagesError;
        }

        if (!messagesData) return [];

        // Get unique user IDs for profiles lookup
        const userIds = Array.from(new Set([
          ...messagesData.map(msg => msg.sender_id),
          ...messagesData.filter(msg => msg.recipient_id).map(msg => msg.recipient_id!)
        ]));

        // Fetch profiles for all users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          // Continue without profiles if there's an error
        }

        // Map messages with profile data
        const messagesWithProfiles: Message[] = messagesData.map(msg => ({
          ...msg,
          sender: profiles?.find(p => p.id === msg.sender_id) || undefined,
          recipient: msg.recipient_id ? profiles?.find(p => p.id === msg.recipient_id) || undefined : undefined
        }));

        return messagesWithProfiles;
      } catch (error: any) {
        console.error("Error in useMessages:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { recipient_id?: string; subject?: string; content: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          ...messageData
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
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
  };
};
