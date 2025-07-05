
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import EnhancedProtectedRoute from "@/components/layout/EnhancedProtectedRoute";

// Import all pages
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ParentRegistrationPage from "./pages/ParentRegistrationPage";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import CheckInKiosk from "./pages/CheckInKiosk";
import UsersManagement from "./pages/UsersManagement";
import StaffPage from "./pages/StaffPage";
import ChildrenManagement from "./pages/ChildrenManagement";
import ClassesManagement from "./pages/ClassesManagement";
import Settings from "./pages/Settings";
import OrganizationSetup from "./pages/OrganizationSetup";
import NotFound from "./pages/NotFound";
import AccessDeniedPage from "./pages/AccessDeniedPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthRedirectHandler>
            <Routes>
              {/* Public routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/parent-registration" element={<ParentRegistrationPage />} />
              <Route path="/organization-setup" element={<OrganizationSetup />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              
              {/* Parent-specific routes */}
              <Route 
                path="/parent-dashboard" 
                element={
                  <EnhancedProtectedRoute requireParentAccess>
                    <ParentDashboard />
                  </EnhancedProtectedRoute>
                } 
              />
              <Route 
                path="/children-management" 
                element={
                  <EnhancedProtectedRoute requireParentAccess>
                    <ChildrenManagement />
                  </EnhancedProtectedRoute>
                } 
              />
              
              {/* Admin-specific routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <EnhancedProtectedRoute requireAdminAccess>
                    <AdminDashboard />
                  </EnhancedProtectedRoute>
                } 
              />
              <Route 
                path="/users-management" 
                element={
                  <EnhancedProtectedRoute requireAdminAccess>
                    <UsersManagement />
                  </EnhancedProtectedRoute>
                } 
              />
              <Route 
                path="/staff-management" 
                element={
                  <EnhancedProtectedRoute requireAdminAccess>
                    <StaffPage />
                  </EnhancedProtectedRoute>
                } 
              />
              <Route 
                path="/classes-management" 
                element={
                  <EnhancedProtectedRoute requireAdminAccess>
                    <ClassesManagement />
                  </EnhancedProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <EnhancedProtectedRoute requireAdminAccess>
                    <Settings />
                  </EnhancedProtectedRoute>
                } 
              />
              
              {/* Teacher routes */}
              <Route 
                path="/teacher-dashboard" 
                element={
                  <EnhancedProtectedRoute allowedRoles={['teacher', 'teacher_assistant', 'staff']}>
                    <TeacherDashboard />
                  </EnhancedProtectedRoute>
                } 
              />
              
              {/* Check-in system routes */}
              <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
              
              {/* Fallback routes */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthRedirectHandler>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
