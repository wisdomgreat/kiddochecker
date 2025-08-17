
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/context/CleanAuthContext";
import { SimpleRoleRouter } from "@/components/auth/SimpleRoleRouter";

// Import pages
import LoginPage from "@/pages/LoginPage";
import LandingPage from "@/pages/LandingPage";
import ParentRegistrationPage from "@/pages/ParentRegistrationPage";
import CheckInKiosk from "@/pages/CheckInKiosk";
import CheckOutStation from "@/pages/CheckOutStation";

// Admin pages
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminUsersPage from "@/pages/AdminUsersPage";

// Parent pages
import ParentDashboardPage from "@/pages/ParentDashboardPage";
import ParentChildrenPage from "@/pages/ParentChildrenPage";
import ParentMessagesPage from "@/pages/ParentMessagesPage";
import ParentAttendancePage from "@/pages/ParentAttendancePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <SimpleRoleRouter />
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/parent-registration" element={<ParentRegistrationPage />} />
                  
                  {/* Kiosk Routes */}
                  <Route path="/checkin" element={<CheckInKiosk />} />
                  <Route path="/checkout" element={<CheckOutStation />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  
                  {/* Parent Routes */}
                  <Route path="/dashboard" element={<ParentDashboardPage />} />
                  <Route path="/parent/children" element={<ParentChildrenPage />} />
                  <Route path="/parent/messages" element={<ParentMessagesPage />} />
                  <Route path="/parent/attendance" element={<ParentAttendancePage />} />
                </Routes>
              </div>
            </AuthProvider>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
