import React, { useState } from 'react';
import KioskCheckInSystem from '@/components/kiosk/KioskCheckInSystem';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tablet, Sparkles, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground text-center">
            Only designated Kiosk terminals or Administrators can access this page.
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
            <h1 className="text-2xl font-black tracking-tight text-foreground">Kiosk Check-In Station</h1>
            <p className="text-sm text-muted-foreground">Touch self-service check-in for children and youth</p>
          </div>
          <Button 
            onClick={() => setFullscreenMode(true)}
            className="gap-2 font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
          >
            <Tablet className="w-4 h-4" />
            Launch Fullscreen Kiosk
          </Button>
        </div>

        <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-black tracking-tight text-foreground">Interactive Touch Kiosk Ready</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Launch the zero-scroll high-definition kiosk terminal designed for iPads, tablets, and check-in desks.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button 
                onClick={() => setFullscreenMode(true)}
                className="h-11 px-6 font-black uppercase text-xs tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-950"
              >
                Launch Kiosk Station <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CheckInPage;


