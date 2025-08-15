
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ParentRegistrationPage from "./pages/ParentRegistrationPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleGuard from "./components/security/RoleGuard";
import ParentDashboard from "./pages/ParentDashboard";
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutStation from "./pages/CheckOutStation";

const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const DeviceManagementPage = lazy(() => import("./pages/DeviceManagementPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const ManagementDashboard = lazy(() => import("./pages/ManagementDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 120000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner 
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
              className: 'bg-background text-foreground border-border',
            }}
          />
          <BrowserRouter>
            <AuthRedirectHandler>
              <Routes>
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/parent-registration" element={<ParentRegistrationPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Suspense fallback={<div>Loading...</div>}>
                        <ManagementDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'admin', 'super_admin']}>
                      <Suspense fallback={<div>Loading...</div>}>
                        <StaffDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'teacher_assistant', 'admin', 'super_admin']}>
                      <Suspense fallback={<div>Loading...</div>}>
                        <TeacherDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent-dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requireParentAccess>
                        <ParentDashboard />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route path="/checkin" element={<CheckInKiosk />} />
                <Route path="/checkout" element={<CheckOutStation />} />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AdminUsersPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/staff-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <StaffManagement />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/user-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <UserManagementPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/users-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <UserManagementPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/device-management" element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <DeviceManagementPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
              </Routes>
            </AuthRedirectHandler>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
