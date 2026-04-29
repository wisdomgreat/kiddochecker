import React, { lazy, Suspense } from "react";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import MFABarrier from "@/components/auth/MFABarrier";

// ─── Lazy Page Imports (code splitting) ───────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DeviceLoginPage = lazy(() => import("./pages/DeviceLoginPage"));
const AdminDocumentVerification = lazy(() => import("./pages/AdminDocumentVerification"));
const StaffDocumentUpload = lazy(() => import("./pages/StaffDocumentUpload"));
const CheckInPage = lazy(() => import("./pages/CheckInPage"));
const CheckOutPage = lazy(() => import("./pages/CheckOutPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
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
const ChurchManagementPage = lazy(() => import("./pages/ChurchManagementPage"));
const InstallPWABanner = lazy(() => import("./components/mobile/InstallPWABanner"));

// ─── Loading Fallback ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Environment Syncing</p>
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
          <InstallPWABanner />
          <BrowserRouter>
            <AuthErrorBoundary>
              <LanguageProvider>
                <ThemeProvider>
                  <AuthProvider>
                  <MFABarrier>
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
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'kiosk']}>
                          <CheckInPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="/check-out" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'kiosk']}>
                          <CheckOutPage />
                        </RoleBasedRoute>
                      } />

                      {/* Admin-Only Routes */}
                      <Route path="/users" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_users"><UsersPage /></RoleBasedRoute>} />
                      <Route path="/roles" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_users"><RolesPage /></RoleBasedRoute>} />
                      <Route path="/staff" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_users"><StaffPage /></RoleBasedRoute>} />
                      <Route path="/staff/schedules" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><StaffSchedulesPage /></RoleBasedRoute>} />
                      <Route path="/reports" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="view_audit_logs"><CombinedReportsWrapper /></RoleBasedRoute>} />
                      <Route path="/settings" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><SettingsPage /></RoleBasedRoute>} />
                      <Route path="/devices" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><DeviceEnrollmentPage /></RoleBasedRoute>} />
                      <Route path="/device-management" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><DeviceEnrollmentPage /></RoleBasedRoute>} />
                      <Route path="/qr-management" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_qr_codes"><QRManagementPage /></RoleBasedRoute>} />
                      <Route path="/admin/shifts" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><ShiftManagementPage /></RoleBasedRoute>} />


                      {/* Staff & Admin Shared Routes */}
                      <Route path="/classes" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']} requiredPermission="manage_classes"><ClassesPage /></RoleBasedRoute>} />
                      <Route path="/attendance" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant']} requiredPermission="view_all_attendance"><AttendancePage /></RoleBasedRoute>} />
                      <Route path="/children" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']} requiredPermission="view_all_children"><ChildrenPage /></RoleBasedRoute>} />
                      <Route path="/admin/church" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant']} requiredPermission="church_view"><ChurchManagementPage /></RoleBasedRoute>} />

                      {/* All Authenticated - but NOT Kiosks */}
                      <Route path="/messages" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><MessagesPage /></ProtectedRoute>} />
                      <Route path="/calendar" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><CalendarPage /></ProtectedRoute>} />

                      {/* Parent-specific routes */}
                      <Route path="/parent/children" element={<ProtectedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentChildrenPage /></ProtectedRoute>} />
                      <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentAttendancePage /></ProtectedRoute>} />
                      <Route path="/parent/messages" element={<ProtectedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentMessagesPage /></ProtectedRoute>} />
                      <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentProfilePage /></ProtectedRoute>} />
                      <Route path="/parent/rewards" element={<ProtectedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentRewardsPage /></ProtectedRoute>} />

                      <Route path="/admin/verify-staff" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                          <AdminDocumentVerification />
                        </RoleBasedRoute>
                      } />
                      <Route path="/staff/documents" element={<ProtectedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin']}><StaffDocumentUpload /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><UserProfile /></ProtectedRoute>} />
                      <Route path="/children/:id/medical" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><ChildMedicalProfile /></RoleBasedRoute>} />
                      <Route path="/audit-log" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><AuditLogPage /></RoleBasedRoute>} />
                      <Route path="/admin/email-templates" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_system"><EmailTemplatesPage /></RoleBasedRoute>} />
                      <Route path="/admin/rewards" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><AttendanceRewardsPage /></RoleBasedRoute>} />
                      <Route path="/admin/system-health" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_system"><SystemHealth /></RoleBasedRoute>} />
                      <Route path="/help" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><HelpDocumentation /></ProtectedRoute>} />
                      <Route path="/about" element={<AboutUsPage />} />
                      <Route path="/centers" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><CentersPage /></ProtectedRoute>} />

                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                  </MFABarrier>
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

