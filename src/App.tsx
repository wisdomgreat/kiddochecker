
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Import all pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import ParentRegistration from "@/pages/ParentRegistration";
import AboutUsPage from "@/pages/AboutUsPage";
import Dashboard from "@/pages/Dashboard";
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
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/teacher-dashboard" element={
            <ProtectedRoute allowedRoles={['teacher', 'teacher_assistant', 'staff']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/parent-dashboard" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <StaffPage />
            </ProtectedRoute>
          } />
          <Route path="/children" element={
            <ProtectedRoute>
              <ChildrenPage />
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
              <ClassesPage />
            </ProtectedRoute>
          } />
          <Route path="/classes-management" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <ClassesManagement />
            </ProtectedRoute>
          } />
          <Route path="/check-in-out" element={
            <ProtectedRoute>
              <CheckInOutManagement />
            </ProtectedRoute>
          } />
          <Route path="/family-connect" element={
            <ProtectedRoute>
              <FamilyConnectPage />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/device-management" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <DeviceManagement />
            </ProtectedRoute>
          } />
          <Route path="/organization-setup" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <OrganizationSetup />
            </ProtectedRoute>
          } />
          <Route path="/roles" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <RolesPage />
            </ProtectedRoute>
          } />
          <Route path="/attendance-rewards" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <AttendanceRewardsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
