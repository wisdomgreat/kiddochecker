
import React from "react";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";

// Auth & Landing Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";

// Dashboard Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import ParentDashboardPage from "./pages/ParentDashboardPage";

// Admin Pages
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminDocumentVerification from "./pages/AdminDocumentVerification";

// Staff Pages
import StaffDocumentUpload from "./pages/StaffDocumentUpload";

// Check-in/Check-out Pages
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutPage from "./pages/CheckOutPage";
import AttendancePage from "./pages/AttendancePage";

// Management Pages
import DeviceManagementPage from "./pages/DeviceManagementPage";
import ClassesPage from "./pages/ClassesPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import RegisterPage from "./pages/RegisterPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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
              <AuthProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/check-in" element={<CheckInKiosk />} />
                  <Route path="/check-out" element={<CheckOutPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Dashboard Routes */}
                  <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                  <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
                  <Route path="/parent-dashboard" element={<ParentDashboardPage />} />

                  {/* Management Routes with working navigation */}
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/classes" element={<ClassesPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthProvider>
            </AuthErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
