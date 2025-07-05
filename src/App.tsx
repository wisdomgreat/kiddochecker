
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import EnhancedProtectedRoute from "@/components/layout/EnhancedProtectedRoute";

// Import all pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import ParentRegistration from "@/pages/ParentRegistration";
import AboutUsPage from "@/pages/AboutUsPage";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Index from "@/pages/Index";
import UsersPage from "@/pages/UsersPage";
import ChildrenPage from "@/pages/ChildrenPage";
import ClassesPage from "@/pages/ClassesPage";
import ClassesManagement from "@/pages/ClassesManagement";
import CheckInProcessPage from "@/pages/CheckInProcessPage";
import FamilyConnectPage from "@/pages/FamilyConnectPage";
import CalendarPage from "@/pages/CalendarPage";
import ParentRegistrationPage from "@/pages/ParentRegistrationPage";
import CheckInOutManagement from "@/pages/CheckInOutManagement";
import DeviceManagement from "@/pages/DeviceManagement";
import OrganizationSetup from "@/pages/OrganizationSetup";
import RolesPage from "@/pages/RolesPage";
import StaffPage from "@/pages/StaffPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import AttendanceRewardsPage from "@/pages/AttendanceRewardsPage";
import AccessDeniedPage from "@/pages/AccessDeniedPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parent-registration" element={<ParentRegistration />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          
          {/* Protected routes with enhanced security */}
          <Route path="/" element={
            <EnhancedProtectedRoute>
              <Index />
            </EnhancedProtectedRoute>
          } />
          
          {/* Admin-only routes - Fixed to use proper admin access */}
          <Route path="/dashboard" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <Dashboard />
            </EnhancedProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminDashboard />
            </EnhancedProtectedRoute>
          } />
          <Route path="/users" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <UsersPage />
            </EnhancedProtectedRoute>
          } />
          <Route path="/staff" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <StaffPage />
            </EnhancedProtectedRoute>
          } />
          <Route path="/classes-management" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <ClassesManagement />
            </EnhancedProtectedRoute>
          } />
          <Route path="/device-management" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <DeviceManagement />
            </EnhancedProtectedRoute>
          } />
          <Route path="/organization-setup" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <OrganizationSetup />
            </EnhancedProtectedRoute>
          } />
          <Route path="/roles" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <RolesPage />
            </EnhancedProtectedRoute>
          } />
          
          {/* Staff/Teacher routes */}
          <Route path="/teacher-dashboard" element={
            <EnhancedProtectedRoute allowedRoles={['teacher', 'teacher_assistant', 'staff']}>
              <Dashboard />
            </EnhancedProtectedRoute>
          } />
          <Route path="/classes" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
              <ClassesPage />
            </EnhancedProtectedRoute>
          } />
          
          {/* Parent-only routes */}
          <Route path="/parent-dashboard" element={
            <EnhancedProtectedRoute requireParentAccess>
              <Dashboard />
            </EnhancedProtectedRoute>
          } />
          <Route path="/attendance-rewards" element={
            <EnhancedProtectedRoute requireParentAccess>
              <AttendanceRewardsPage />
            </EnhancedProtectedRoute>
          } />
          
          {/* Mixed access routes - context-dependent */}
          <Route path="/children" element={
            <EnhancedProtectedRoute>
              <ChildrenPage />
            </EnhancedProtectedRoute>
          } />
          <Route path="/check-in-out" element={
            <EnhancedProtectedRoute>
              <CheckInOutManagement />
            </EnhancedProtectedRoute>
          } />
          <Route path="/family-connect" element={
            <EnhancedProtectedRoute>
              <FamilyConnectPage />
            </EnhancedProtectedRoute>
          } />
          <Route path="/calendar" element={
            <EnhancedProtectedRoute>
              <CalendarPage />
            </EnhancedProtectedRoute>
          } />
          <Route path="/reports" element={
            <EnhancedProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}>
              <ReportsPage />
            </EnhancedProtectedRoute>
          } />
          <Route path="/settings" element={
            <EnhancedProtectedRoute>
              <SettingsPage />
            </EnhancedProtectedRoute>
          } />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
