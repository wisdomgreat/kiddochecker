import React, { useState } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { MessageSquare, Plus, Send, Inbox, Users, Bell } from 'lucide-react';

const MessagesManagement = () => {
  const { toast } = useToast();
  const { messages, isLoading, sendMessage } = useMessages();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    recipient_type: 'all' // 'all', 'parents', 'staff', 'teachers'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMessage({
        subject: formData.subject,
        content: formData.content,
        recipient_role: formData.recipient_type !== 'all' ? formData.recipient_type : 'all'
      });
      toast({
        title: "Message Sent",
        description: "Your broadcast has been sent successfully.",
      });
      setIsDialogOpen(false);
      setFormData({ subject: '', content: '', recipient_type: 'all' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages & Communication</h1>
            <p className="text-muted-foreground">
              Manage communications with parents, staff, and members.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="recipient_type">Send To</Label>
                  <select
                    id="recipient_type"
                    value={formData.recipient_type}
                    onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Users</option>
                    <option value="parents">Parents Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="teachers">Teachers Only</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox">
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="h-4 w-4 mr-2" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="broadcast">
              <Bell className="h-4 w-4 mr-2" />
              Broadcast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Received Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{message.subject}</h3>
                            <p className="text-sm text-muted-foreground">
                              From: {message.sender_id}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(message.created_at)}
                          </div>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex justify-between items-center mt-3">
                          <Badge variant={message.is_read ? "outline" : "default"}>
                            {message.is_read ? 'Read' : 'Unread'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Reply
                          </Button>
                        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">Sent messages will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Broadcast Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h3 className="font-semibold mb-2">Quick Announcements</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setFormData({
                            subject: 'Service Update',
                            content: 'Please note that our service schedule has been updated.',
                            recipient_type: 'all'
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Service Update
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setFormData({
                            subject: 'Emergency Alert',
                            content: 'Important safety information for all members.',
                            recipient_type: 'all'
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Emergency Alert
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setFormData({
                            subject: 'Event Reminder',
                            content: 'Don\'t forget about our upcoming event!',
                            recipient_type: 'all'
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Event Reminder
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

export default MessagesManagement;