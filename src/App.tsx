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

// ─── Resilient Lazy Page Imports (Auto-recovers from new deploys/stale chunks) ──
const lazyWithRetry = (factory: () => Promise<any>) =>
  lazy(async () => {
    const pageHasBeenForceRefreshed = sessionStorage.getItem('kiddo_chunk_retry_timestamp');
    try {
      return await factory();
    } catch (error: any) {
      console.warn('[ChunkLoader] Stale bundle chunk detected. Auto-refreshing window...', error);
      const now = Date.now();
      if (!pageHasBeenForceRefreshed || now - parseInt(pageHasBeenForceRefreshed, 10) > 15000) {
        sessionStorage.setItem('kiddo_chunk_retry_timestamp', String(now));
        window.location.reload();
      }
      throw error;
    }
  });

const Index = lazyWithRetry(() => import("./pages/Index"));
const LoginPage = lazyWithRetry(() => import("./pages/LoginPage"));
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const DeviceLoginPage = lazyWithRetry(() => import("./pages/DeviceLoginPage"));
const AdminDocumentVerification = lazyWithRetry(() => import("./pages/AdminDocumentVerification"));
const StaffDocumentUpload = lazyWithRetry(() => import("./pages/StaffDocumentUpload"));
const CheckInPage = lazyWithRetry(() => import("./pages/CheckInPage"));
const CheckInSetupPage = lazyWithRetry(() => import("./pages/CheckInSetupPage"));
const CheckOutPage = lazyWithRetry(() => import("./pages/CheckOutPage"));
const AttendancePage = lazyWithRetry(() => import("./pages/AttendancePage"));
const DeviceEnrollmentPage = lazyWithRetry(() => import("./pages/DeviceEnrollmentPage"));
const ClassesPage = lazyWithRetry(() => import("./pages/ClassesPage"));
const CombinedReportsWrapper = lazyWithRetry(() => import("./pages/CombinedReportsPage"));
const UsersPage = lazyWithRetry(() => import("./pages/UsersPage"));
const RolesPage = lazyWithRetry(() => import("./pages/RolesPage"));
const RegisterPage = lazyWithRetry(() => import("./pages/RegisterPage"));
const ParentRegistration = lazyWithRetry(() => import("./pages/ParentRegistration"));
const ForgotPasswordPage = lazyWithRetry(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const StaffPage = lazyWithRetry(() => import("./pages/StaffPage"));
const MessagesPage = lazyWithRetry(() => import("./pages/MessagesPage"));
const ChildrenPage = lazyWithRetry(() => import("./pages/ChildrenPage"));
const CalendarPage = lazyWithRetry(() => import("./pages/CalendarPage"));
const StaffSchedulesPage = lazyWithRetry(() => import("./pages/StaffSchedulesPage"));
const ParentChildrenPage = lazyWithRetry(() => import("./pages/ParentChildrenPage"));
const ParentAttendancePage = lazyWithRetry(() => import("./pages/ParentAttendancePage"));
const ParentMessagesPage = lazyWithRetry(() => import("./pages/ParentMessagesPage"));
const ParentProfilePage = lazyWithRetry(() => import("./pages/ParentProfilePage"));
const ParentRewardsPage = lazyWithRetry(() => import("./pages/ParentRewardsPage"));
const ChildMedicalProfile = lazyWithRetry(() => import("./pages/ChildMedicalProfile"));
const QRManagementPage = lazyWithRetry(() => import("./pages/QRManagementPage"));
const AuditLogPage = lazyWithRetry(() => import("./pages/AuditLogPage"));
const EmailTemplatesPage = lazyWithRetry(() => import("./pages/EmailTemplatesPage"));
const EmailLogsPage = lazyWithRetry(() => import("./pages/EmailLogsPage"));
const UserProfile = lazyWithRetry(() => import("./pages/UserProfile"));
const AttendanceRewardsPage = lazyWithRetry(() => import("./pages/AttendanceRewardsPage"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const HelpDocumentation = lazyWithRetry(() => import("./pages/HelpDocumentation"));
const AboutUsPage = lazyWithRetry(() => import("./pages/AboutUsPage"));
const CentersPage = lazyWithRetry(() => import("./pages/CentersPage"));

const ShiftManagementPage = lazyWithRetry(() => import("./pages/ShiftManagementPage"));
const ChurchManagementPage = lazyWithRetry(() => import("./pages/ChurchManagementPage"));
const InstallPWABanner = lazyWithRetry(() => import("./components/mobile/InstallPWABanner"));

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
                      <Route path="/check-in-setup" element={
                        <RoleBasedRoute allowedRoles={['admin', 'super_admin', 'kiosk', 'staff', 'teacher', 'volunteer']}>
                          <CheckInSetupPage />
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
                      <Route path="/admin/email-logs" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_system"><EmailLogsPage /></RoleBasedRoute>} />
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

