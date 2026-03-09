import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import AdminDashboardNew from "./AdminDashboardNew";
import StaffTeacherDashboard from "./StaffTeacherDashboard";
import ParentDashboardNew from "./ParentDashboardNew";
import DocumentUploadSystem from "@/components/staff/DocumentUploadSystem";

const UnifiedDashboard = () => {
  const { user, userRole, loading, isAdmin, isSuperAdmin, isStaff, isParent, isVerifiedStaff } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-slate-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Super admin or admin
  if (isSuperAdmin || isAdmin || userRole === "super_admin" || userRole === "admin") {
    return <AdminDashboardNew />;
  }

  // Staff and teachers
  if (isStaff || userRole === "staff" || userRole === "teacher" || userRole === "teacher_assistant") {
    // If not verified and they are a staff role, show the Document Upload (Onboarding) Dashboard
    if (!isVerifiedStaff && userRole !== 'volunteer') {
      return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-xl mt-1 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-amber-900 mb-1">Action Required: Complete Your Onboarding</h1>
              <p className="text-amber-800">
                Welcome to KiddoChecker! Before you can access your dashboard and specific features, you must complete your staff verification profile.
              </p>
            </div>
          </div>
          
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

  // Final absolute fallback - log mismatch
  console.warn("UnifiedDashboard: No explicit role matched for user", user?.id, "Role:", userRole);
  return <ParentDashboardNew />;
};

export default UnifiedDashboard;