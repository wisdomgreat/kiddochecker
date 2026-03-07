import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import AdminDashboardNew from "./AdminDashboardNew";
import StaffTeacherDashboard from "./StaffTeacherDashboard";
import ParentDashboardNew from "./ParentDashboardNew";

const UnifiedDashboard = () => {
  const { user, userRole, loading, isAdmin, isStaff, isParent } = useAuth();

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
  if (isAdmin || userRole === "super_admin" || userRole === "admin") {
    return <AdminDashboardNew />;
  }

  // Teacher or Teacher Assistant — use Staff/Teacher dashboard
  if (userRole === "teacher" || userRole === "teacher_assistant") {
    return <StaffTeacherDashboard />;
  }

  // General staff
  if (isStaff) {
    return <StaffTeacherDashboard />;
  }

  // Parent
  if (isParent) {
    return <ParentDashboardNew />;
  }

  // Fallback
  return <ParentDashboardNew />;
};

export default UnifiedDashboard;