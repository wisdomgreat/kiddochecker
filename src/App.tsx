import React from "react";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";

// Auth & Landing Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Landing from "./pages/Landing";

// Dashboard Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import ParentDashboardPage from "./pages/ParentDashboardPage";

// Admin Pages
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminDocumentVerification from "./pages/AdminDocumentVerification";

// Staff Pages
import StaffDocumentUpload from "./pages/StaffDocumentUpload";

// Check-in/Check-out Pages
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutPage from "./pages/CheckOutPage";

// Management Pages
import DeviceManagementPage from "./pages/DeviceManagementPage";
import ClassesPage from "./pages/ClassesPage";
import AttendancePage from "./pages/AttendancePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
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
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/landing" element={<Landing />} />

              {/* Check-in/Check-out Routes (public for kiosk mode) */}
              <Route path="/check-in" element={<CheckInKiosk />} />
              <Route path="/check-out" element={<CheckOutPage />} />

              {/* Role-based Dashboard Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <RoleBasedRoute>
                    <div>Loading...</div>
                  </RoleBasedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/user-management" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/document-verification" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDocumentVerification />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/devices" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <DeviceManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/classes" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <ClassesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Staff Routes */}
              <Route 
                path="/staff-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant']}>
                    <StaffDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/staff/upload-documents" 
                element={
                  <ProtectedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant']}>
                    <StaffDocumentUpload />
                  </ProtectedRoute>
                } 
              />

              {/* Parent Routes */}
              <Route 
                path="/parent-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                } 
              />

              {/* Shared Routes (for all authenticated users) */}
              <Route 
                path="/attendance" 
                element={
                  <ProtectedRoute>
                    <AttendancePage />
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
