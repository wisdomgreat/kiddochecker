import React from 'react';
import { Navigate } from 'react-router-dom';
import RoleGuard from "@/components/security/RoleGuard";
import { useAuth } from "@/context/CleanAuthContext";

const VolunteerDashboard = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isStaff = userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant';
  const isVolunteer = userRole === 'volunteer';

  if (!isAdmin && !isStaff && !isVolunteer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <RoleGuard requireAdminAccess={false}>
        <div>
          <h1 className="text-3xl font-semibold mb-4">Volunteer Dashboard</h1>
          <p className="text-gray-700">Welcome to the volunteer dashboard!</p>
        </div>
      </RoleGuard>
    </div>
  );
};

export default VolunteerDashboard;
