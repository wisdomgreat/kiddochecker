import React, { lazy, Suspense } from "react";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";
import { Loader2 } from "lucide-react";

// ─── Lazy Page Imports (code splitting) ───────────────────────────────────────
// Auth & Landing
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DeviceLoginPage = lazy(() => import("./pages/DeviceLoginPage"));
// Dashboards are handled by Index -> UnifiedDashboard

// Admin
const AdminDocumentVerification = lazy(() => import("./pages/AdminDocumentVerification"));
const StaffDocumentUpload = lazy(() => import("./pages/StaffDocumentUpload"));

// Check-in / attendance
const CheckInPage = lazy(() => import("./pages/CheckInPage"));
const CheckOutPage = lazy(() => import("./pages/CheckOutPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));

// Management
const DeviceEnrollmentPage = lazy(() => import("./pages/DeviceEnrollmentPage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const CombinedReportsWrapper = lazy(() => import("./pages/CombinedReportsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const RolesPage = lazy(() => import("./pages/RolesPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ChildrenPage = lazy(() => import("./pages/ChildrenPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const StaffSchedulesPage = lazy(() => import("./pages/StaffSchedulesPage"));
const ParentChildrenPage = lazy(() => import("./pages/ParentChildrenPage"));
const ParentAttendancePage = lazy(() => import("./pages/ParentAttendancePage"));
const ParentMessagesPage = lazy(() => import("./pages/ParentMessagesPage"));
const ParentProfilePage = lazy(() => import("./pages/ParentProfilePage"));
const ParentRewardsPage = lazy(() => import("./pages/ParentRewardsPage"));
const ChildMedicalProfile = lazy(() => import("./pages/ChildMedicalProfile"));
const QRManagementPage = lazy(() => import("./pages/QRManagementPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const EmailTemplatesPage = lazy(() => import("./pages/EmailTemplatesPage"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const AttendanceRewardsPage = lazy(() => import("./pages/AttendanceRewardsPage"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const HelpDocumentation = lazy(() => import("./pages/HelpDocumentation"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const CentersPage = lazy(() => import("./pages/CentersPage"));
const ShiftManagementPage = lazy(() => import("./pages/ShiftManagementPage"));


// ─── Loading Fallback ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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
              <LanguageProvider>
                <ThemeProvider>
                  <AuthProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/device-login" element={<DeviceLoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/landing" element={<LandingPage />} />
                      <Route path="/check-in" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'kiosk']}>
                          <CheckInPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="/check-out" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'kiosk']}>
                          <CheckOutPage />
                        </RoleBasedRoute>
                      } />
                      {/* Dashboard routes handled by index route */}

                      {/* Admin-Only Routes */}
                      <Route path="/users" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><UsersPage /></RoleBasedRoute>} />
                      <Route path="/roles" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><RolesPage /></RoleBasedRoute>} />
                      <Route path="/staff" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><StaffPage /></RoleBasedRoute>} />
                      <Route path="/staff/schedules" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><StaffSchedulesPage /></RoleBasedRoute>} />
                      <Route path="/reports" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><CombinedReportsWrapper /></RoleBasedRoute>} />
                      <Route path="/settings" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><SettingsPage /></RoleBasedRoute>} />
                      <Route path="/devices" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><DeviceEnrollmentPage /></RoleBasedRoute>} />
                      <Route path="/device-management" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><DeviceEnrollmentPage /></RoleBasedRoute>} />
                      <Route path="/qr-management" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><QRManagementPage /></RoleBasedRoute>} />
                      <Route path="/admin/shifts" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><ShiftManagementPage /></RoleBasedRoute>} />


                      {/* Staff & Admin Shared Routes */}
                      <Route path="/classes" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><ClassesPage /></RoleBasedRoute>} />
                      <Route path="/attendance" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant']}><AttendancePage /></RoleBasedRoute>} />
                      <Route path="/children" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><ChildrenPage /></RoleBasedRoute>} />

                      {/* All Authenticated */}
                      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

                      {/* Parent-specific routes */}
                      <Route path="/parent/children" element={<ProtectedRoute><ParentChildrenPage /></ProtectedRoute>} />
                      <Route path="/parent/attendance" element={<ProtectedRoute><ParentAttendancePage /></ProtectedRoute>} />
                      <Route path="/parent/messages" element={<ProtectedRoute><ParentMessagesPage /></ProtectedRoute>} />
                      <Route path="/parent/profile" element={<ProtectedRoute><ParentProfilePage /></ProtectedRoute>} />
                      <Route path="/parent/rewards" element={<ProtectedRoute><ParentRewardsPage /></ProtectedRoute>} />

                      {/* Staff Verification & Document Routes – admin-only */}
                      <Route path="/admin/verify-staff" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                          <AdminDocumentVerification />
                        </RoleBasedRoute>
                      } />
                      <Route path="/staff/documents" element={<ProtectedRoute><StaffDocumentUpload /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                      <Route path="/children/:id/medical" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><ChildMedicalProfile /></RoleBasedRoute>} />
                      <Route path="/audit-log" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><AuditLogPage /></RoleBasedRoute>} />
                      <Route path="/admin/email-templates" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><EmailTemplatesPage /></RoleBasedRoute>} />
                      <Route path="/admin/rewards" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><AttendanceRewardsPage /></RoleBasedRoute>} />
                      <Route path="/admin/system-health" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><SystemHealth /></RoleBasedRoute>} />
                      <Route path="/admin/system-health" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><SystemHealth /></RoleBasedRoute>} />
                      <Route path="/help" element={<ProtectedRoute><HelpDocumentation /></ProtectedRoute>} />
                      <Route path="/about" element={<AboutUsPage />} />
                      <Route path="/centers" element={<ProtectedRoute><CentersPage /></ProtectedRoute>} />

                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </AuthProvider>
              </ThemeProvider>
            </LanguageProvider>
            </AuthErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
