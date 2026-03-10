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
import { MessageSquare, Plus, Send, Inbox, Users, Bell, Clock, Search, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

const MessagesManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    recipient_type: 'all' // 'all', 'parents', 'staff', 'teachers'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMessage({
        subject: formData.subject || "No Subject",
        content: formData.content,
        recipient_role: formData.recipient_type !== 'all' ? formData.recipient_type : 'all'
      });
      setIsDialogOpen(false);
      setFormData({ subject: '', content: '', recipient_type: 'all' });
    } catch (error) {
       // Error handled by hook
    }
  };

  const handleReply = (message: any) => {
    setFormData({
      subject: message.subject?.startsWith("Re:") ? message.subject : `Re: ${message.subject || "Message"}`,
      content: `\n\n--- Original Message ---\n${message.content}`,
      recipient_type: 'all' // Reset but we will override if we had recipient_id
    });
    // For direct reply we'd need recipient_id, but broadcast management is role focused.
    // However, we can use the sendMessage hook to send to a specific person if we want.
    setIsDialogOpen(true);
  };

  const filteredMessages = messages.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ModernLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">Communication Center</h1>
            <p className="text-muted-foreground mt-1">
              Broadcast announcements and manage system-wide notifications.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-5 w-5 mr-2" />
                New Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-primary px-6 py-4">
                <DialogTitle className="text-white text-xl">Create New Communication</DialogTitle>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipient_type" className="font-semibold">Target Audience</Label>
                        <select
                            id="recipient_type"
                            value={formData.recipient_type}
                            onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                            className="w-full h-10 px-3 bg-background border border-input rounded-md ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">Everyone (All Users)</option>
                            <option value="parents">Parents Only</option>
                            <option value="staff">Staff & Admins</option>
                            <option value="teachers">Teachers Only</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="font-semibold">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Announcement Title"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="font-semibold">Message Body</Label>
                  <Textarea
                    id="content"
                    placeholder="Type your message here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    required
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                    Discard
                  </Button>
                  <Button type="submit" className="px-8 shadow-md">
                    <Send className="h-4 w-4 mr-2" />
                    Send Communication
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search all communications..." 
                className="pl-9 bg-background shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>

        <Tabs defaultValue="inbox" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="inbox" className="px-6">
              <Inbox className="h-4 w-4 mr-2" />
              Incoming
            </TabsTrigger>
            <TabsTrigger value="sent" className="px-6">
              <Send className="h-4 w-4 mr-2" />
              Outgoing
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="px-6">
              <Bell className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            <Card className="border-primary/5 shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-primary" />
                  Received Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading...</div>
                ) : filteredMessages.filter(m => m.recipient_id === user?.id || (m.recipient_role && m.sender_id !== user?.id)).length === 0 ? (
                  <div className="text-center py-20">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted/50" />
                    <p className="text-muted-foreground text-lg">No incoming messages found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMessages
                      .filter(m => m.recipient_id === user?.id || (m.recipient_role && m.sender_id !== user?.id))
                      .map((message) => (
                      <div key={message.id} className={`p-6 hover:bg-muted/20 transition-all ${!message.is_read ? 'bg-primary/5' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              {message.subject || "No Subject"}
                              {!message.is_read && <Badge className="animate-pulse">NEW</Badge>}
                              {message.is_broadcast && <Badge variant="secondary">Broadcast</Badge>}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {message.sender?.first_name} {message.sender?.last_name}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(message.created_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             {!message.is_read && (
                                <Button size="sm" variant="outline" onClick={() => markAsRead(message)}>
                                    Mark Read
                                </Button>
                             )}
                             <Button size="sm" onClick={() => handleReply(message)}>
                                <Reply className="h-4 w-4 mr-2" /> Reply
                             </Button>
                          </div>
                        </div>
                        <div className="bg-background border rounded-xl p-4 shadow-inner">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card className="border-primary/5 shadow-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Sent Communications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredMessages.filter(m => m.sender_id === user?.id).length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground italic">No sent messages</div>
                    ) : (
                        <div className="divide-y">
                             {filteredMessages.filter(m => m.sender_id === user?.id).map(msg => (
                                 <div key={msg.id} className="p-6">
                                     <div className="flex justify-between items-start mb-2">
                                         <h4 className="font-bold text-lg">{msg.subject}</h4>
                                         <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "MMM d, HH:mm")}</span>
                                     </div>
                                     <div className="flex items-center gap-2 mb-3">
                                         <span className="text-sm text-muted-foreground text-xs uppercase font-bold tracking-wider">To:</span>
                                         <Badge variant="outline">
                                             {msg.recipient_role ? `Broadcast: ${msg.recipient_role}` : msg.recipient ? `${msg.recipient.first_name} ${msg.recipient.last_name}` : "All"}
                                         </Badge>
                                     </div>
                                     <p className="text-sm text-muted-foreground line-clamp-2 italic">"{msg.content}"</p>
                                 </div>
                             ))}
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-4">
            <Card className="border-primary/5 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Broadcast Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'service', title: 'Service Update', icon: <Bell className="text-blue-500" />, content: 'Please note that our service schedule has been updated.' },
                    { id: 'emergency', title: 'Emergency Alert', icon: <Bell className="text-red-500" />, content: 'Important safety information for all members.' },
                    { id: 'event', title: 'Event Reminder', icon: <Bell className="text-green-500" />, content: 'Don\'t forget about our upcoming event!' },
                    { id: 'weather', title: 'Weather Advisory', icon: <Bell className="text-amber-500" />, content: 'Inclement weather update: Stay tuned for potential delays.' },
                  ].map(tmpl => (
                    <Card key={tmpl.id} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group" onClick={() => {
                        setFormData({ subject: tmpl.title, content: tmpl.content, recipient_type: 'all' });
                        setIsDialogOpen(true);
                      }}>
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="p-4 bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">
                                {tmpl.icon}
                            </div>
                            <h3 className="font-bold text-lg">{tmpl.title}</h3>
                            <p className="text-sm text-muted-foreground">{tmpl.content.substring(0, 40)}...</p>
                            <Button variant="ghost" className="w-full mt-2 group-hover:bg-primary group-hover:text-white">Use Template</Button>
                        </CardContent>
                    </Card>
                  ))}
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