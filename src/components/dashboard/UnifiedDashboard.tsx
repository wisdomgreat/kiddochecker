import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, X, ArrowRight } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import AdminDashboardNew from "./AdminDashboardNew";
import StaffTeacherDashboard from "./StaffTeacherDashboard";
import ParentDashboardNew from "./ParentDashboardNew";
import VolunteerDashboardNew from "./VolunteerDashboardNew";
import DocumentUploadSystem from "@/components/staff/DocumentUploadSystem";
import MfaEnrollment from "@/components/auth/MfaEnrollment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const UnifiedDashboard = () => {
  const { user, userRole, loading, isAdmin, isSuperAdmin, isStaff, isParent, isVerifiedStaff, isMfaEnrolled } = useAuth();
  const [mfaBannerDismissed, setMfaBannerDismissed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
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
          <div className="space-y-6 max-w-3xl mx-auto py-8 font-['Outfit']">
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-bold text-amber-900 dark:text-amber-200">
                Security Policy: Mandatory Two-Factor Authentication (2FA) Required
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                Administrative security policy requires two-factor authentication to be configured before accessing administrative controls.
              </AlertDescription>
            </Alert>
            <MfaEnrollment />
          </div>
        );
      }
      return <AdminDashboardNew />;
    }

    // Staff and teachers - require 2FA
    if (isStaff || userRole === "staff" || userRole === "teacher" || userRole === "teacher_assistant") {
      if (!isMfaEnrolled) {
        return (
          <div className="space-y-6 max-w-3xl mx-auto py-8 font-['Outfit']">
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-bold text-amber-900 dark:text-amber-200">
                Staff Security Requirement: Two-Factor Authentication (2FA) Required
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                To protect child records and church security, all staff accounts must configure two-factor authentication before accessing operational features.
              </AlertDescription>
            </Alert>
            <MfaEnrollment />
          </div>
        );
      }

      // If not verified and they are a staff role, show Document Upload (Onboarding)
      if (!isVerifiedStaff && userRole !== 'volunteer') {
        return (
          <div className="space-y-6 max-w-5xl mx-auto py-8">
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
      {/* Non-blocking MFA enrollment banner */}
      {showMfaBanner && (
        <div className="border-b border-warning/20 bg-warning/5 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Two-Factor Authentication Recommended
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
                  Protect sensitive child data by enabling MFA in your security settings.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-warning/30 bg-warning/10 hover:bg-warning/20 text-warning"
              >
                <Link to="/settings">
                  Set Up Now <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              <button
                onClick={() => setMfaBannerDismissed(true)}
                className="p-1 rounded hover:bg-warning/20 text-warning transition-colors"
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

