
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ParentRegistrationPage from "./pages/ParentRegistrationPage";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import RoleGuard from "./components/security/RoleGuard";
import ParentDashboard from "./pages/ParentDashboard";
import CheckinKiosk from "./pages/CheckinKiosk";
import CheckoutStation from "./pages/CheckoutStation";

const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const DeviceManagementPage = lazy(() => import("./pages/DeviceManagementPage"));

// Create PublicRoute component for routes that should only be accessible when not authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 120000, // Updated from cacheTime to gcTime
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
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/parent-registration"
                element={
                  <PublicRoute>
                    <ParentRegistrationPage />
                  </PublicRoute>
                }
              />
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
                path="/parent-dashboard"
                element={
                  <ProtectedRoute>
                    <RoleGuard requireParentAccess>
                      <ParentDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route path="/checkin" element={<CheckinKiosk />} />
              <Route path="/checkout" element={<CheckoutStation />} />
              <Route path="/admin/users" element={
                <Suspense fallback={<div>Loading...</div>}>
                  <AdminUsersPage />
                </Suspense>
              } />
              <Route path="/staff-management" element={
                <Suspense fallback={<div>Loading...</div>}>
                  <StaffManagement />
                </Suspense>
              } />
              <Route path="/user-management" element={
                <Suspense fallback={<div>Loading...</div>}>
                  <UserManagementPage />
                </Suspense>
              } />
              <Route path="/device-management" element={
                <Suspense fallback={<div>Loading...</div>}>
                  <DeviceManagementPage />
                </Suspense>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
