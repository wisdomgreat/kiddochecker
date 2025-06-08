
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Image, Calendar, FileText, CheckCircle, Clock } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import useUserRoles from "@/hooks/useUserRoles";

const FamilyConnectPage = () => {
  const { user, userRole } = useAuth();
  const { messages, isLoading, sendMessage, isSending, markAsRead } = useMessages();
  const { data: users = [] } = useUserRoles();
  const [activeTab, setActiveTab] = useState("messaging");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  
  // Get teachers/staff for parents to message
  const teachers = users.filter(u => 
    u.role === 'teacher' || u.role === 'teacher_assistant' || u.role === 'staff' || u.role === 'admin'
  );
  
  // Get parents for teachers/staff to message
  const parents = users.filter(u => u.role === 'parent');
  
  const availableContacts = userRole === 'parent' ? teachers : parents;
  
  // Sample announcements (would be real in production)
  const announcements = [
    { 
      id: "1", 
      title: "Parent-Teacher Conference", 
      date: "2025-06-15", 
      content: "Our annual parent-teacher conferences are coming up next week. Please sign up for a time slot.",
      acknowledged: false
    },
    { 
      id: "2", 
      title: "Summer Program Registration", 
      date: "2025-06-08", 
      content: "Registration for our summer enrichment program is now open. Spaces are limited.",
      acknowledged: true
    }
  ];
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessage({
      recipient_id: selectedRecipient || undefined,
      subject: subject || undefined,
      content: message
    });
    
    setMessage("");
    setSubject("");
    setSelectedRecipient("");
  };

  const handleMessageClick = (msg: any) => {
    if (!msg.is_read && msg.recipient_id === user?.id) {
      markAsRead(msg.id);
    }
  };
  
  const isParent = userRole === "parent";
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Connect</h1>
            <p className="text-muted-foreground">
              Stay connected with your child's teacher and classroom activities
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="messaging" className="flex items-center space-x-2 px-4 py-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center space-x-2 px-4 py-2">
              <Calendar className="h-4 w-4" />
              <span>Announcements</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="messaging">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Contacts</CardTitle>
                  <CardDescription>
                    {isParent ? "Your child's teachers" : "Parent contacts"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableContacts.map((contact) => (
                      <div 
                        key={contact.id} 
                        className={`flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                          selectedRecipient === contact.id ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedRecipient(contact.id)}
                      >
                        <Avatar>
                          <AvatarFallback>
                            {contact.firstName?.charAt(0) || ''}{contact.lastName?.charAt(0) || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                          <div className="text-sm text-muted-foreground capitalize">{contact.role}</div>
                          <div className="text-sm text-muted-foreground">{contact.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>
                    Recent conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4 h-[400px] overflow-y-auto p-2">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`p-3 rounded-lg cursor-pointer ${
                            msg.sender_id === user?.id 
                              ? "bg-primary/10 ml-8" 
                              : "bg-gray-100 mr-8"
                          } ${!msg.is_read && msg.recipient_id === user?.id ? 'border-l-4 border-blue-500' : ''}`}
                          onClick={() => handleMessageClick(msg)}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">
                              {msg.sender_id === user?.id ? "You" : `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          {msg.subject && (
                            <div className="text-sm font-medium mb-1">{msg.subject}</div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          {!msg.is_read && msg.recipient_id === user?.id && (
                            <Badge variant="secondary" className="mt-2">Unread</Badge>
                          )}
                        </div>
                      ))}
                      
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-muted-foreground">No messages yet</p>
                          <p className="text-sm text-muted-foreground">Start a conversation below</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="w-full space-y-2">
                    <Input 
                      placeholder="Subject (optional)"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                    <div className="flex w-full items-center space-x-2">
                      <Textarea 
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 min-h-[80px]"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!message.trim() || isSending}
                        className="self-end"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSending ? "Sending..." : "Send"}
                      </Button>
                    </div>
                    {selectedRecipient && (
                      <p className="text-xs text-muted-foreground">
                        Sending to: {availableContacts.find(c => c.id === selectedRecipient)?.firstName} {availableContacts.find(c => c.id === selectedRecipient)?.lastName}
                      </p>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="announcements">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{announcement.title}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {announcement.date}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{announcement.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      variant={announcement.acknowledged ? "secondary" : "outline"}
                      disabled={announcement.acknowledged}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {announcement.acknowledged ? "Acknowledged" : "Acknowledge"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {announcements.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">No announcements at this time</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
