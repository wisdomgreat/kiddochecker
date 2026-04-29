import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import AttendanceTracking from '@/components/parent/AttendanceTracking';

const ParentAttendancePage = () => {
  return (
    <UnifiedDashboardLayout>
      <AttendanceTracking />
    </UnifiedDashboardLayout>
  );
};

export default ParentAttendancePage;

