
import React from "react";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";

// Auth & Landing Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";

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
import AttendancePage from "./pages/AttendancePage";

// Management Pages
import DeviceManagementPage from "./pages/DeviceManagementPage";
import ClassesPage from "./pages/ClassesPage";
import EnhancedReportsPage from "./pages/EnhancedReportsPage";
import UsersPage from "./pages/UsersPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import StaffPage from "./pages/StaffPage";
import MessagesPage from "./pages/MessagesPage";
import ChildrenPage from "./pages/ChildrenPage";
import CalendarPage from "./pages/CalendarPage";
import ParentChildrenPage from "./pages/ParentChildrenPage";
import ParentAttendancePage from "./pages/ParentAttendancePage";
import ParentMessagesPage from "./pages/ParentMessagesPage";
import ParentProfilePage from "./pages/ParentProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthErrorBoundary>
              <AuthProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/check-in" element={<CheckInKiosk />} />
                  <Route path="/check-out" element={<CheckOutPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Dashboard Routes */}
                  <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                  <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
                  <Route path="/parent-dashboard" element={<ParentDashboardPage />} />

                  {/* Protected Management Routes */}
                  <Route path="/users" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}><UsersPage /></RoleBasedRoute>} />
                  <Route path="/classes" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher']}><ClassesPage /></RoleBasedRoute>} />
                  <Route path="/attendance" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher', 'teacher_assistant']}><AttendancePage /></RoleBasedRoute>} />
                  <Route path="/reports" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}><EnhancedReportsPage /></RoleBasedRoute>} />
                  <Route path="/settings" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}><SettingsPage /></RoleBasedRoute>} />
                  <Route path="/staff" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}><StaffPage /></RoleBasedRoute>} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/children" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher']}><ChildrenPage /></RoleBasedRoute>} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  
                  {/* Parent-specific routes */}
                  <Route path="/parent/children" element={<ParentChildrenPage />} />
                  <Route path="/parent/attendance" element={<ParentAttendancePage />} />
                  <Route path="/parent/messages" element={<ParentMessagesPage />} />
                  <Route path="/parent/profile" element={<ParentProfilePage />} />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthProvider>
            </AuthErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
