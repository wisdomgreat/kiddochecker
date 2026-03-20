import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import MessageSystem from '@/components/communication/MessageSystem';
const MessagesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <MessageSystem />
    </UnifiedDashboardLayout>
  );
};

export default MessagesPage;
