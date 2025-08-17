
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";

// Auth & Landing Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ParentRegistrationPage from "./pages/ParentRegistrationPage";
import OrganizationSetup from "./pages/OrganizationSetup";

// Dashboard Pages
import FixedParentDashboard from "./components/parent/FixedParentDashboard";
import ComprehensiveStaffDashboard from "./components/staff/ComprehensiveStaffDashboard";
import ComprehensiveAdminDashboard from "./components/admin/ComprehensiveAdminDashboard";

// Management Pages
import ParentChildrenPage from "./pages/ParentChildrenPage";
import ParentAttendancePage from "./pages/ParentAttendancePage";
import ParentMessagesPage from "./pages/ParentMessagesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ClassesPage from "./pages/ClassesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

// Check-in/Check-out System
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutStation from "./pages/CheckOutStation";
import CheckInProcessPage from "./pages/CheckInProcessPage";
import CheckOutProcessPage from "./pages/CheckOutProcessPage";

// Device & Kiosk Management
import DeviceManagementPage from "./pages/DeviceManagementPage";
import KioskManagement from "./pages/KioskManagement";

import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<ParentRegistrationPage />} />
              <Route path="/setup" element={<OrganizationSetup />} />
              
              {/* Kiosk Routes - These might need to be public for device access */}
              <Route path="/kiosk/checkin" element={<CheckInKiosk />} />
              <Route path="/kiosk/checkout" element={<CheckOutStation />} />
              <Route path="/kiosk/device-setup" element={<KioskManagement />} />
              
              {/* Protected Routes - Parent Dashboard */}
              <Route 
                path="/parent" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['parent']}>
                      <FixedParentDashboard />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent/children" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['parent']}>
                      <ParentChildrenPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent/attendance" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['parent']}>
                      <ParentAttendancePage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent/messages" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['parent']}>
                      <ParentMessagesPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Routes - Staff Dashboard */}
              <Route 
                path="/staff" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant']}>
                      <ComprehensiveStaffDashboard />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Routes - Admin Dashboard */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <ComprehensiveAdminDashboard />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <AdminUsersPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/classes" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <ClassesPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/devices" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <DeviceManagementPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <ReportsPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute>
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <SettingsPage />
                    </RoleBasedRoute>
                  </ProtectedRoute>
                } 
              />
              
              {/* Check-in/Check-out Process Routes */}
              <Route 
                path="/checkin" 
                element={
                  <ProtectedRoute>
                    <CheckInProcessPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <CheckOutProcessPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirects based on user role */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Navigate to="/parent" replace />
                  </ProtectedRoute>
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
