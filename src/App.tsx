
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";

// Import all pages
import AdminDashboard from "@/pages/AdminDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import UsersManagement from "@/pages/UsersManagement";
import StaffManagement from "@/pages/StaffManagement";
import ClassesManagement from "@/pages/ClassesManagement";
import CheckInOutPage from "@/pages/CheckInOutPage";
import CheckInKiosk from "@/pages/CheckInKiosk";
import CheckOutStation from "@/pages/CheckOutStation";
import ReportsPage from "@/pages/ReportsPage";
import CalendarPage from "@/pages/CalendarPage";
import FamilyConnectPage from "@/pages/FamilyConnectPage";
import SettingsPage from "@/pages/SettingsPage";
import OrganizationSetup from "@/pages/OrganizationSetup";
import ChildrenManagement from "@/pages/ChildrenManagement";
import DeviceManagement from "@/pages/DeviceManagement";
import LoginPage from "@/pages/LoginPage";
import ParentRegistrationPage from "@/pages/ParentRegistrationPage";
import LandingPage from "@/pages/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simplified role-based dashboard redirect
const DashboardRedirect = () => {
  const { userRole } = useAuth();
  
  console.log('DashboardRedirect: Current user role:', userRole);
  
  switch (userRole) {
    case 'admin':
    case 'super_admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'staff':
    case 'teacher':
    case 'teacher_assistant':
      return <Navigate to="/staff-dashboard" replace />;
    case 'parent':
      return <Navigate to="/parent-dashboard" replace />;
    default:
      console.log('DashboardRedirect: Unknown role, redirecting to login');
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/parent-registration" element={<ParentRegistrationPage />} />
              
              {/* Kiosk routes (public) */}
              <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
              <Route path="/check-out-station" element={<CheckOutStation />} />
              
              {/* Root redirect */}
              <Route path="/" element={<DashboardRedirect />} />
              
              {/* Admin-only routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboard />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/users-management" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <UsersManagement />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/staff-management" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <StaffManagement />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/classes-management" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <ClassesManagement />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/device-management" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <DeviceManagement />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <SettingsPage />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/organization-setup" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                    <OrganizationSetup />
                  </RoleBasedRoute>
                } 
              />
              
              {/* Staff routes */}
              <Route 
                path="/staff-dashboard" 
                element={
                  <RoleBasedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant']}>
                    <StaffDashboard />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/check-in-out" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant']}>
                    <CheckInOutPage />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <ReportsPage />
                  </RoleBasedRoute>
                } 
              />
              
              {/* Parent routes - STRICT ACCESS */}
              <Route 
                path="/parent-dashboard" 
                element={
                  <RoleBasedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/children-management" 
                element={
                  <RoleBasedRoute allowedRoles={['parent']}>
                    <ChildrenManagement />
                  </RoleBasedRoute>
                } 
              />
              
              {/* Common routes */}
              <Route 
                path="/calendar" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'parent']}>
                    <CalendarPage />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/family-connect" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'parent']}>
                    <FamilyConnectPage />
                  </RoleBasedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
