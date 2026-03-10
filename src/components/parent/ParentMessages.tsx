import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/CleanAuthContext";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Mail, Clock } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const ParentMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageContent, setMessageContent] = useState("");

  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ["parent-messages", user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching messages:", error);
          return [];
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in ParentMessages:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          content: content,
          subject: `Message from Parent: ${user.email}`,
          recipient_role: 'staff', // This ensures it shows up in staff dashboard inbox
          is_broadcast: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-messages"] });
      setMessageContent("");
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

  const handleSendMessage = () => {
    sendMessageMutation.mutate(messageContent);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Parent Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p>Loading messages...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error.message}</p>
          ) : messages.length === 0 ? (
            <p>No messages sent yet.</p>
          ) : (
            messages.map(message => (
              <div key={message.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {message.sender_id === user?.id ? 'You' : 'Staff'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(message.created_at), "MMM dd, yyyy hh:mm a")}
                  </div>
                </div>
                {message.subject && (
                  <p className="text-sm font-medium mt-1">{message.subject}</p>
                )}
                <p className="mt-2">{message.content}</p>
              </div>
            ))
          )}

          <div className="border rounded-md p-4">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Write your message here..."
              className="w-full mb-2"
            />
            <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? (
                <>
                  Sending...
                  <Clock className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParentMessages;
