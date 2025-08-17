
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy load components
const Index = lazy(() => import("@/pages/Index"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage"));
const StaffDashboard = lazy(() => import("@/components/staff/StaffDashboard"));
const ChildNotesManager = lazy(() => import("@/components/notes/ChildNotesManager"));
const ParentDashboardOverview = lazy(() => import("@/components/dashboard/ParentDashboardOverview"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
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
        <BrowserRouter>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Staff routes */}
                <Route 
                  path="/staff" 
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Teacher routes */}
                <Route 
                  path="/notes" 
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'teacher_assistant', 'staff', 'admin', 'super_admin']}>
                      <ChildNotesManager />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Parent routes */}
                <Route 
                  path="/parent" 
                  element={
                    <ProtectedRoute allowedRoles={['parent']}>
                      <ParentDashboardOverview />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
