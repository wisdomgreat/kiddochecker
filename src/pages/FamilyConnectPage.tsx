
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const FamilyConnectPage = () => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const { data: messages } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(first_name, last_name),
          recipient:profiles!messages_recipient_id_fkey(first_name, last_name)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const sendMessage = async () => {
    if (!user?.id || !newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        subject: newSubject || 'General Message',
        content: newMessage,
        recipient_id: null // For now, sending to admin/general
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      setNewSubject('');
      // Refresh messages
      window.location.reload();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Family Connect</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Directory
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages?.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{message.subject}</h4>
                          <p className="text-sm text-gray-600">
                            From: {message.sender?.first_name} {message.sender?.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={message.is_read ? "secondary" : "default"}>
                            {message.is_read ? "Read" : "Unread"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(message.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}

                  {!messages || messages.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No messages yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Teacher
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Report Absence
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Contact Admin
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm">Welcome to Family Connect!</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Stay connected with teachers and other families.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-sm">System Online</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      All systems are operational and ready for use.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
