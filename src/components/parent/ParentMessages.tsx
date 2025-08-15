
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

const ParentMessages = () => {
  const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["parent-messages", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-gray-600">Communications from teachers and staff</p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
            <p className="text-gray-500">Messages from teachers and staff will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Inbox ({messages.filter(m => !m.is_read).length} unread)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">
                        {message.subject || "No Subject"}
                      </h4>
                      {!message.is_read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.created_at), "MMM dd, yyyy 'at' HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedMessage.subject || "No Subject"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedMessage.created_at), "MMMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                  
                  {!selectedMessage.is_read && (
                    <div className="border-t pt-4">
                      <Button
                        size="sm"
                        onClick={() => markAsRead(selectedMessage.id)}
                      >
                        Mark as Read
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a message to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ParentMessages;
