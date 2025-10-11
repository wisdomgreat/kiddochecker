import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import ParentChildManagement from '@/components/parent/ParentChildManagement';

const ParentChildrenPage = () => {
  return (
    <UnifiedDashboardLayout>
      <ParentChildManagement />
    </UnifiedDashboardLayout>
  );
};

export default ParentChildrenPage;
