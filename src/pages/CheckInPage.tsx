import React from 'react';
import KioskCheckInSystem from '@/components/kiosk/KioskCheckInSystem';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/context/AuthContext';

const CheckInPage = () => {
  const { userRole } = useAuth();

  const allowedRoles = ['admin', 'super_admin', 'kiosk'];
  const hasAccess = userRole && allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground text-center">
            Only designated Kiosk terminals or Administrators can access this page.
          </p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  // Kiosk devices get a full-screen immersive experience without the sidebar
  if (userRole === 'kiosk') {
    return <KioskCheckInSystem />;
  }

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
