import React, { lazy, Suspense } from "react";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { ThemeProvider } from "@/context/ThemeContext";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";
import { Loader2 } from "lucide-react";
import MFABarrier from "@/components/auth/MFABarrier";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

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
const ParentRegistration = lazy(() => import("./pages/ParentRegistration"));
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
const CentersPage = lazy(() => import("./pages/CentersPage")); // Removed from routes below

const ShiftManagementPage = lazy(() => import("./pages/ShiftManagementPage"));
const ChurchManagementPage = lazy(() => import("./pages/ChurchManagementPage"));
const InstallPWABanner = lazy(() => import("./components/mobile/InstallPWABanner"));

// ─── Loading Fallback ──────────────────────────────────────────────────────────
const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative h-full w-full rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">{t('syncingEnvironment')}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('authorizingModules')}</p>
        </div>
      </div>
    </div>
  );
};

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
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
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
                      <Route path="/parent-registration" element={<ParentRegistration />} />
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
                      <Route path="/messages" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><MessagesPage /></RoleBasedRoute>} />
                      <Route path="/calendar" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><CalendarPage /></RoleBasedRoute>} />

                      {/* Parent-specific routes */}
                      <Route path="/parent/children" element={<RoleBasedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentChildrenPage /></RoleBasedRoute>} />
                      <Route path="/parent/attendance" element={<RoleBasedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentAttendancePage /></RoleBasedRoute>} />
                      <Route path="/parent/messages" element={<RoleBasedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentMessagesPage /></RoleBasedRoute>} />
                      <Route path="/parent/profile" element={<RoleBasedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentProfilePage /></RoleBasedRoute>} />
                      <Route path="/parent/rewards" element={<RoleBasedRoute allowedRoles={['parent', 'admin', 'super_admin']}><ParentRewardsPage /></RoleBasedRoute>} />

                      <Route path="/admin/verify-staff" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                          <AdminDocumentVerification />
                        </RoleBasedRoute>
                      } />
                      <Route path="/staff/documents" element={<RoleBasedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin']}><StaffDocumentUpload /></RoleBasedRoute>} />
                      <Route path="/profile" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher', 'parent', 'volunteer', 'regular_user']}><UserProfile /></RoleBasedRoute>} />
                      <Route path="/children/:id/medical" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin', 'staff', 'teacher']}><ChildMedicalProfile /></RoleBasedRoute>} />
                      <Route path="/audit-log" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><AuditLogPage /></RoleBasedRoute>} />
                      <Route path="/admin/email-templates" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_system"><EmailTemplatesPage /></RoleBasedRoute>} />
                      <Route path="/admin/rewards" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']}><AttendanceRewardsPage /></RoleBasedRoute>} />
                      <Route path="/admin/system-health" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_system"><SystemHealth /></RoleBasedRoute>} />
                      <Route path="/help" element={<HelpDocumentation />} />
                      <Route path="/faq" element={<HelpDocumentation />} />
                      <Route path="/about" element={<AboutUsPage />} />
                      {/* Center Finder Removed */}

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
      </MsalProvider>
    </ErrorBoundary>
  );
}

export default App;

