
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";

// Import pages
import LoginPage from "@/pages/LoginPage";
import LandingPage from "@/pages/LandingPage";
import ParentRegistrationPage from "@/pages/ParentRegistrationPage";
import CheckInKiosk from "@/pages/CheckInKiosk";
import CheckOutStation from "@/pages/CheckOutStation";

// Admin Pages
import CleanAdminDashboard from "@/components/admin/CleanAdminDashboard";
import AdminUsersPage from "@/pages/AdminUsersPage";
import CheckInOutManagement from "@/pages/CheckInOutManagement";

// Parent Pages  
import CleanParentDashboard from "@/components/parent/CleanParentDashboard";

import MobileFirstLayout from "@/components/layout/MobileFirstLayout";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthRedirectHandler>
              <RoleBasedRedirect />
              <Routes>
                {/* Public Routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/parent-registration" element={<ParentRegistrationPage />} />
                
                {/* Kiosk Routes (Public) */}
                <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
                <Route path="/checkin" element={<CheckInKiosk />} />
                <Route path="/checkout" element={<CheckOutStation />} />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <MobileFirstLayout>
                    <CleanAdminDashboard />
                  </MobileFirstLayout>
                } />
                <Route path="/admin/users" element={
                  <MobileFirstLayout>
                    <AdminUsersPage />
                  </MobileFirstLayout>
                } />
                <Route path="/admin/checkin" element={
                  <MobileFirstLayout>
                    <CheckInOutManagement />
                  </MobileFirstLayout>
                } />
                
                {/* Parent Routes */}
                <Route path="/dashboard" element={
                  <MobileFirstLayout>
                    <CleanParentDashboard />
                  </MobileFirstLayout>
                } />
                
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/landing" replace />} />
                
                {/* Catch all - redirect to landing */}
                <Route path="*" element={<Navigate to="/landing" replace />} />
              </Routes>
            </AuthRedirectHandler>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
