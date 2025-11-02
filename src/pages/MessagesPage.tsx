import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import MessageSystem from '@/components/communication/MessageSystem';
const MessagesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communication center</p>
        </div>
        <MessageSystem />
      </div>
    </UnifiedDashboardLayout>
  );
};

export default MessagesPage;
