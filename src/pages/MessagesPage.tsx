import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';

const MessagesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Communication center</p>
          </div>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No messages yet</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Message Thread</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Conversation Selected</h3>
                <p className="text-muted-foreground">
                  Select a conversation to view messages
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default MessagesPage;
