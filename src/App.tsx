
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

// Additional pages that were missing
import AboutUsPage from "./pages/AboutUsPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import AttendanceRewardsPage from "./pages/AttendanceRewardsPage";
import CalendarPage from "./pages/CalendarPage";
import CheckInOutManagement from "./pages/CheckInOutManagement";
import CheckInOutPage from "./pages/CheckInOutPage";
import CheckInProcess from "./pages/CheckInProcess";
import CheckInProcessPage from "./pages/CheckInProcessPage";
import CheckInSetupPage from "./pages/CheckInSetupPage";
import CheckOutProcessPage from "./pages/CheckOutProcessPage";
import ChildrenManagement from "./pages/ChildrenManagement";
import ChildrenPage from "./pages/ChildrenPage";
import ClassesPage from "./pages/ClassesPage";
import Dashboard from "./pages/Dashboard";
import DeviceManagement from "./pages/DeviceManagement";
import EventsManagement from "./pages/EventsManagement";
import FamilyConnectPage from "./pages/FamilyConnectPage";
import KioskManagement from "./pages/KioskManagement";
import LandingPage from "./pages/LandingPage";
import ManagementDashboard from "./pages/ManagementDashboard";
import NotFound from "./pages/NotFound";
import OrganizationSetup from "./pages/OrganizationSetup";
import ParentRegistrationPage from "./pages/ParentRegistrationPage";
import ReportsDashboard from "./pages/ReportsDashboard";
import ReportsPage from "./pages/ReportsPage";
import RolePermissionsManagement from "./pages/RolePermissionsManagement";
import RolesManagement from "./pages/RolesManagement";
import RolesPage from "./pages/RolesPage";
import SettingsPage from "./pages/SettingsPage";
import StaffPage from "./pages/StaffPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import UserProfile from "./pages/UserProfile";
import UsersPage from "./pages/UsersPage";

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
                <Route path="/parent-registration-page" element={<ParentRegistrationPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/about-us" element={<AboutUsPage />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />
                
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
                
                <Route path="/teacher-dashboard" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
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

                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/management-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <ManagementDashboard />
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

                <Route path="/device-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <DeviceManagement />
                  </ProtectedRoute>
                } />

                <Route path="/events-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff']}>
                    <EventsManagement />
                  </ProtectedRoute>
                } />

                <Route path="/kiosk-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <KioskManagement />
                  </ProtectedRoute>
                } />

                <Route path="/roles-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <RolesManagement />
                  </ProtectedRoute>
                } />

                <Route path="/role-permissions-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <RolePermissionsManagement />
                  </ProtectedRoute>
                } />

                <Route path="/organization-setup" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <OrganizationSetup />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />

                <Route path="/settings-page" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                {/* Feature pages */}
                <Route path="/children-management" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ChildrenManagement />
                  </ProtectedRoute>
                } />

                <Route path="/children" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ChildrenPage />
                  </ProtectedRoute>
                } />

                <Route path="/classes" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <ClassesPage />
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

                <Route path="/roles" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <RolesPage />
                  </ProtectedRoute>
                } />

                <Route path="/calendar" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent']}>
                    <CalendarPage />
                  </ProtectedRoute>
                } />

                <Route path="/family-connect" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent']}>
                    <FamilyConnectPage />
                  </ProtectedRoute>
                } />

                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />

                <Route path="/reports-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <ReportsDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/attendance-rewards" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <AttendanceRewardsPage />
                  </ProtectedRoute>
                } />

                {/* Check-in/out related routes */}
                <Route path="/check-in-out" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <CheckInOutPage />
                  </ProtectedRoute>
                } />

                <Route path="/check-in-out-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <CheckInOutManagement />
                  </ProtectedRoute>
                } />

                <Route path="/check-in-process" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <CheckInProcess />
                  </ProtectedRoute>
                } />

                <Route path="/check-in-process-page" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <CheckInProcessPage />
                  </ProtectedRoute>
                } />

                <Route path="/check-in-setup" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <CheckInSetupPage />
                  </ProtectedRoute>
                } />

                <Route path="/check-out-process" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}>
                    <CheckOutProcessPage />
                  </ProtectedRoute>
                } />

                {/* Profile routes */}
                <Route path="/user-profile" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent']}>
                    <UserProfile />
                  </ProtectedRoute>
                } />

                <Route path="/teacher-profile" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherProfile />
                  </ProtectedRoute>
                } />

                {/* 404 Not Found - must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthRedirectHandler>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
