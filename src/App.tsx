
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Setup from "./pages/Setup";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ChildrenManagement from "./pages/ChildrenManagement";
import UsersManagement from "./pages/UsersManagement";
import StaffManagement from "./pages/StaffManagement";
import ClassesManagement from "./pages/ClassesManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutProcessPage from "./pages/CheckOutProcessPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ReportsPage from "./pages/ReportsPage";
import OrganizationSettings from "./pages/OrganizationSettings";
import DeviceManagement from "./pages/DeviceManagement";
import RoleGuard from "@/components/security/RoleGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/setup" element={<Setup />} />
            
            {/* Parent Routes */}
            <Route path="/parent" element={
              <RoleGuard requireParentAccess>
                <ParentDashboard />
              </RoleGuard>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <RoleGuard requireAdminAccess>
                <AdminDashboard />
              </RoleGuard>
            } />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/settings" element={
              <RoleGuard requireAdminAccess>
                <OrganizationSettings />
              </RoleGuard>
            } />
            
            {/* Staff Routes */}
            <Route path="/staff" element={
              <RoleGuard requireStaffAccess>
                <StaffDashboard />
              </RoleGuard>
            } />
            
            {/* Management Routes */}
            <Route path="/children" element={<ChildrenManagement />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/staff-management" element={<StaffManagement />} />
            <Route path="/classes" element={<ClassesManagement />} />
            <Route path="/attendance" element={<AttendanceManagement />} />
            <Route path="/devices" element={<DeviceManagement />} />
            
            {/* Kiosk Routes */}
            <Route path="/checkin-kiosk" element={<CheckInKiosk />} />
            <Route path="/checkout-process" element={<CheckOutProcessPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
