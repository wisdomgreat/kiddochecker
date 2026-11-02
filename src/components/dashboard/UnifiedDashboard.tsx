import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, X } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import AdminDashboardNew from "./AdminDashboardNew";
import StaffTeacherDashboard from "./StaffTeacherDashboard";
import ParentDashboardNew from "./ParentDashboardNew";
import VolunteerDashboardNew from "./VolunteerDashboardNew";
import DocumentUploadSystem from "@/components/staff/DocumentUploadSystem";
import MfaEnrollment from "@/components/auth/MfaEnrollment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MfaRequiredGateProps {
  title: string;
  description: string;
}

/** Blocking 2FA enrollment screen shown to privileged roles that have not enrolled yet. */
const MfaRequiredGate = ({ title, description }: MfaRequiredGateProps) => (
  <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto py-3 sm:py-8">
    <Alert className="border-warning/50 bg-warning/10">
      <ShieldAlert className="h-5 w-5 !text-warning" />
      <AlertTitle className="font-bold text-foreground">{title}</AlertTitle>
      <AlertDescription className="text-muted-foreground">{description}</AlertDescription>
    </Alert>
    <MfaEnrollment />
  </div>
);

const UnifiedDashboard = () => {
  const { user, userRole, loading, isAdmin, isSuperAdmin, isStaff, isParent, isVerifiedStaff, isMfaEnrolled } = useAuth();
  const [mfaBannerDismissed, setMfaBannerDismissed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // Kiosk - Explicitly redirect to check-in
  if (userRole === "kiosk") {
    return <Navigate to="/check-in" replace />;
  }

  // Non-blocking MFA enrollment reminder for parents or roles not covered by mandatory gate
  const showMfaBanner = isParent && !isMfaEnrolled && !mfaBannerDismissed;

  // Determine the dashboard content based on role
  const renderDashboard = () => {
    // Super admin or admin - require 2FA
    if (isSuperAdmin || isAdmin) {
      if (!isMfaEnrolled) {
        return (
          <MfaRequiredGate
            title="Security Policy: Mandatory Two-Factor Authentication (2FA) Required"
            description="Administrative security policy requires two-factor authentication to be configured before accessing administrative controls."
          />
        );
      }
      return <AdminDashboardNew />;
    }

    // Staff and teachers - require 2FA
    if (isStaff || userRole === "staff" || userRole === "teacher" || userRole === "teacher_assistant") {
      if (!isMfaEnrolled) {
        return (
          <MfaRequiredGate
            title="Staff Security Requirement: Two-Factor Authentication (2FA) Required"
            description="To protect child records and church security, all staff accounts must configure two-factor authentication before accessing operational features."
          />
        );
      }

      // If not verified and they are a staff role, show Document Upload (Onboarding)
      if (!isVerifiedStaff && userRole !== 'volunteer') {
        return (
          <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto py-3 sm:py-8">
            <Alert variant="destructive">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle className="font-bold">Action Required: Complete Your Onboarding</AlertTitle>
              <AlertDescription>
                Welcome to KiddoChecker! Before you can access your dashboard and specific features, you must complete your staff verification profile.
              </AlertDescription>
            </Alert>
            
            <DocumentUploadSystem />
          </div>
        );
      }
      
      return <StaffTeacherDashboard />;
    }

    // Volunteer
    if (userRole === "volunteer") {
      return <VolunteerDashboardNew />;
    }

    // Parent 
    if (isParent || userRole === "parent") {
      return <ParentDashboardNew />;
    }

    // Final absolute fallback
    console.warn("UnifiedDashboard: No explicit role matched for user", user?.id, "Role:", userRole);
    return <ParentDashboardNew />;
  };

  return (
    <div>
      {/* Non-blocking MFA enrollment banner - compact on mobile */}
      {showMfaBanner && (
        <div className="mb-2.5 sm:mb-4 rounded-xl border border-warning/30 bg-warning/5 px-2.5 py-1.5 sm:px-4 sm:py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Two-Factor Authentication Recommended
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Protect sensitive child data by enabling MFA in settings.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-3 text-sm border-warning/40"
              >
                <Link to="/settings">
                  Set up
                </Link>
              </Button>
              <button
                onClick={() => setMfaBannerDismissed(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-warning/20 hover:text-foreground active:bg-warning/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                aria-label="Dismiss MFA reminder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {renderDashboard()}
    </div>
  );
};

export default UnifiedDashboard;

