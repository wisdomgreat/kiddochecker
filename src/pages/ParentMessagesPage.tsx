import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import ParentMessages from '@/components/parent/ParentMessages';

const ParentMessagesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <ParentMessages />
    </UnifiedDashboardLayout>
  );
};

export default ParentMessagesPage;
