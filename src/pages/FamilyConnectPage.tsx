
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Image, Calendar, FileText, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FamilyConnectPage = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("messaging");
  const [message, setMessage] = useState("");
  
  // Sample data (would be real-time in production)
  const teachers = [
    { id: "1", name: "Ms. Johnson", avatar: "", role: "Lead Teacher", class: "Sunbeam Class" },
    { id: "2", name: "Mr. Smith", avatar: "", role: "Assistant Teacher", class: "Rainbow Class" }
  ];
  
  const announcements = [
    { id: "1", title: "Parent-Teacher Conference", date: "2025-06-15", content: "Our annual parent-teacher conferences are coming up next week. Please sign up for a time slot." },
    { id: "2", title: "Summer Program Registration", date: "2025-06-08", content: "Registration for our summer enrichment program is now open. Spaces are limited." }
  ];
  
  const activities = [
    { id: "1", title: "Story Time", description: "Recent books we've read in class", images: ["book1.jpg", "book2.jpg"] },
    { id: "2", title: "Arts & Crafts", description: "This week's art project about animals", images: ["art1.jpg", "art2.jpg"] }
  ];
  
  const recentMessages = [
    { id: "1", sender: "Ms. Johnson", time: "Today, 2:30 PM", content: "Emma had a great day today! She participated well in our science activity." },
    { id: "2", sender: "You", time: "Today, 3:15 PM", content: "Thank you for letting me know! She was excited about it this morning." }
  ];
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // In a real app, this would send to a database
    toast({
      title: "Message Sent",
      description: "Your message has been delivered to the teacher.",
    });
    
    setMessage("");
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
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="messaging" className="flex items-center space-x-2 px-4 py-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messaging</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center space-x-2 px-4 py-2">
              <Calendar className="h-4 w-4" />
              <span>Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center space-x-2 px-4 py-2">
              <FileText className="h-4 w-4" />
              <span>Activities</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="messaging">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                  <CardDescription>
                    {isParent ? "Your child's teachers" : "Parent contacts"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50">
                        <Avatar>
                          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                          {teacher.avatar && <AvatarImage src={teacher.avatar} />}
                        </Avatar>
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-sm text-muted-foreground">{teacher.role}</div>
                          <div className="text-sm text-muted-foreground">{teacher.class}</div>
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
                  <div className="space-y-4 h-[400px] overflow-y-auto p-2">
                    {recentMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-3 rounded-lg ${
                          msg.sender === "You" 
                            ? "bg-primary/10 ml-8" 
                            : "bg-gray-100 mr-8"
                        }`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{msg.sender}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full items-center space-x-2">
                    <Button variant="outline" size="icon">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Input 
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
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
                    <Button variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {announcements.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">No announcements at this time</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="activities">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardHeader>
                    <CardTitle>{activity.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{activity.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {activity.images.map((img, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
