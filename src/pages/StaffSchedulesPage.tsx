import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import StaffSchedules from '@/components/staff/StaffSchedules';

const StaffSchedulesPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <StaffSchedules />
      </div>
    </UnifiedDashboardLayout>
  );
};

export default StaffSchedulesPage;
