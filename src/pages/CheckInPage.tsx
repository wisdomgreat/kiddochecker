import React from 'react';
import KioskCheckInSystem from '@/components/kiosk/KioskCheckInSystem';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

const CheckInPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Kiosk Check-In</h1>
          <p className="text-muted-foreground">Self-service or staff-assisted child check-in</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <KioskCheckInSystem />
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CheckInPage;
