import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";
import AdminDashboardNew from "./AdminDashboardNew";
import StaffTeacherDashboard from "./StaffTeacherDashboard";
import ParentDashboardNew from "./ParentDashboardNew";
import DocumentUploadSystem from "@/components/staff/DocumentUploadSystem";
import SecuritySettings from "@/components/settings/SecuritySettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const UnifiedDashboard = () => {
  const { user, userRole, loading, isAdmin, isSuperAdmin, isStaff, isParent, isVerifiedStaff, isMfaEnrolled } = useAuth();

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

  // Super admin or admin
  if (isSuperAdmin || isAdmin || userRole === "super_admin" || userRole === "admin") {
    return <AdminDashboardNew />;
  }

  // Security Check: Enforce MFA for Admin/Staff
  if ((isAdmin || isSuperAdmin || isStaff) && !isMfaEnrolled && userRole !== 'kiosk') {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-8">
        <Alert variant="default" className="border-primary/20 bg-primary/5">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-xl font-bold tracking-tight">Security Setup Required</AlertTitle>
            <AlertDescription className="mt-2 text-base">
                To protect sensitive child data and organizational records, all personnel with elevated access are <span className="font-bold underline">required</span> to enable Two-Factor Authentication (MFA). 
                Please complete this setup before proceeding to your dashboard.
            </AlertDescription>
        </Alert>
        
        <div className="bg-card border rounded-lg p-8 shadow-sm">
            <SecuritySettings />
        </div>
      </div>
    );
  }

  // Staff and teachers
  if (isStaff || userRole === "staff" || userRole === "teacher" || userRole === "teacher_assistant") {
    // If not verified and they are a staff role, show the Document Upload (Onboarding) Dashboard
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


  // Parent 
  if (isParent || userRole === "parent") {
    return <ParentDashboardNew />;
  }

  // Kiosk - Explicitly redirect to check-in if they hit the base dashboard
  if (userRole === "kiosk") {
    return <Navigate to="/check-in" replace />;
  }

  // Final absolute fallback - log mismatch
  console.warn("UnifiedDashboard: No explicit role matched for user", user?.id, "Role:", userRole);
  return <ParentDashboardNew />;
};

export default UnifiedDashboard;
