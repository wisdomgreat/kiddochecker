
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AdminDashboard from "@/pages/AdminDashboard";
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
import OrganizationSetupPage from "@/pages/OrganizationSetupPage";
import ChildrenManagement from "@/pages/ChildrenManagement";
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
              <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
              <Route path="/check-out-station" element={<CheckOutStation />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/users-management" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <UsersManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/staff-management" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <StaffManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/classes-management" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}>
                  <ClassesManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/check-in-out" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                  <CheckInOutPage />
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              } />
              
              <Route path="/family-connect" element={
                <ProtectedRoute>
                  <FamilyConnectPage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/organization-setup" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <OrganizationSetupPage />
                </ProtectedRoute>
              } />
              
              <Route path="/children-management" element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ChildrenManagement />
                </ProtectedRoute>
              } />

              {/* Legacy redirects */}
              <Route path="/users" element={<Navigate to="/users-management" replace />} />
              
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
