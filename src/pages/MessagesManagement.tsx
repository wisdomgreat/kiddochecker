
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

const MessagesManagement = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Messages & Communication</h1>
            <p className="text-muted-foreground">Manage messages, announcements, and notifications</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Communication management features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default MessagesManagement;
