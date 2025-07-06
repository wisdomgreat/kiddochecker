
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { 
  Send, 
  Inbox, 
  Mail, 
  Users, 
  Info,
  MessageCircle,
  Reply
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const FamilyConnectPage = () => {
  const { user, userRole } = useAuth();
  const { messages, sendMessage, isSending } = useMessages();
  const [activeTab, setActiveTab] = useState('inbox');
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    recipient_id: ''
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim()) return;

    try {
      await sendMessage({
        subject: newMessage.subject || 'No Subject',
        content: newMessage.content,
        recipient_id: newMessage.recipient_id || undefined
      });
      
      setNewMessage({ subject: '', content: '', recipient_id: '' });
      setActiveTab('inbox');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const sentMessages = messages.filter(msg => msg.sender_id === user?.id);
  const receivedMessages = messages.filter(msg => msg.recipient_id === user?.id || !msg.recipient_id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Connect</h1>
            <p className="text-muted-foreground">
              Communication hub for parents, staff, and administrators
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {userRole === 'parent' ? 'Parent Account' : 'Staff Account'}
          </Badge>
        </div>

        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How Family Connect Works:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li><strong>Parents:</strong> Send messages to staff/admin about your children, ask questions, or share updates</li>
              <li><strong>Staff/Admin:</strong> Broadcast announcements to all families or reply to specific parent messages</li>
              <li><strong>General Messages:</strong> Leave recipient blank to send to all users (admin/staff only)</li>
              <li><strong>Direct Messages:</strong> Add recipient ID for private messages (feature coming soon)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox" className="flex items-center space-x-2">
              <Inbox className="h-4 w-4" />
              <span>Inbox ({receivedMessages.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Sent ({sentMessages.length})</span>
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Compose</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Inbox className="h-5 w-5" />
                  <span>Received Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivedMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages received yet</p>
                    <p className="text-sm">Check back later for updates from staff and other parents</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {message.sender?.first_name} {message.sender?.last_name} 
                                {!message.sender?.first_name && 'System Message'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        {message.subject && (
                          <h4 className="font-medium text-sm mb-2">{message.subject}</h4>
                        )}
                        <p className="text-sm text-muted-foreground">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Sent Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sent messages</p>
                    <p className="text-sm">Messages you send will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">
                            To: {message.recipient_id ? 'Direct Message' : 'All Users'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {message.subject && (
                          <h4 className="font-medium text-sm mb-2">{message.subject}</h4>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compose" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>Compose Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject (Optional)</label>
                    <Input
                      placeholder="Enter message subject..."
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message *</label>
                    <Textarea
                      placeholder={userRole === 'parent' 
                        ? "Write your message to staff/admin here..."
                        : "Write your message here... (leave recipient blank to send to all users)"
                      }
                      value={newMessage.content}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {userRole === 'parent' 
                        ? 'Message will be sent to staff and administrators'
                        : 'Message will be sent to all users (parents and staff)'
                      }
                    </p>
                    <Button type="submit" disabled={isSending || !newMessage.content.trim()}>
                      {isSending ? 'Sending...' : 'Send Message'}
                      <Send className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
