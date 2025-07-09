
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";

// Import all pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ParentRegistration from "./pages/ParentRegistration";
import ParentDashboard from "./pages/ParentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutStation from "./pages/CheckOutStation";
import StaffRealtimeDashboard from "./pages/StaffRealtimeDashboard";
import UsersManagement from "./pages/UsersManagement";
import ClassesManagement from "./pages/ClassesManagement";
import StaffManagement from "./pages/StaffManagement";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthRedirectHandler>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/parent-registration" element={<ParentRegistration />} />
                
                {/* Kiosk and Station routes - public access */}
                <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
                <Route path="/check-out-station" element={<CheckOutStation />} />
                
                {/* Protected dashboard routes */}
                <Route path="/parent-dashboard" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/staff-dashboard" element={
                  <ProtectedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/staff-realtime" element={
                  <ProtectedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin']}>
                    <StaffRealtimeDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Management routes */}
                <Route path="/users-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <UsersManagement />
                  </ProtectedRoute>
                } />

                <Route path="/classes-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <ClassesManagement />
                  </ProtectedRoute>
                } />

                <Route path="/staff-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <StaffManagement />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </AuthRedirectHandler>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
