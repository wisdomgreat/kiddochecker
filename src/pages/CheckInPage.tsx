import React, { useState } from 'react';
import KioskCheckInSystem from '@/components/kiosk/KioskCheckInSystem';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tablet, ArrowRight, ShieldCheck, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckInPage = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [fullscreenMode, setFullscreenMode] = useState(true);

  const allowedRoles = ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'kiosk'];
  const hasAccess = userRole && allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <h1 className="text-2xl font-semibold text-destructive">Access Denied</h1>
          <p className="text-sm text-muted-foreground text-center">
            Only designated Kiosk terminals or administrators can access this station.
          </p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  // Kiosk role or full-screen mode gets the direct immersive zero-scroll kiosk system
  if (userRole === 'kiosk' || fullscreenMode) {
    return <KioskCheckInSystem />;
  }

  return (
    <UnifiedDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kiosk Check-In Station</h1>
            <p className="text-sm text-muted-foreground">Self-service touch check-in for children and youth</p>
          </div>
          <Button 
            onClick={() => setFullscreenMode(true)}
            className="gap-2 font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors"
          >
            <Tablet className="w-4 h-4" />
            Launch Fullscreen Kiosk
          </Button>
        </div>

        <div className="border border-border/80 bg-card rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Monitor className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">Interactive Touch Kiosk Ready</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Launch the zero-scroll kiosk terminal optimized for iPads, touch tablets, and greeting desks at church entrances.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Button 
              onClick={() => setFullscreenMode(true)}
              className="h-11 px-6 font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Launch Kiosk Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CheckInPage;
