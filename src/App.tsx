
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

// Import pages with correct paths
import Login from "@/pages/LoginPage";
import Register from "@/pages/ParentRegistration";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import UsersManagement from "@/pages/UsersManagement";
import StaffManagement from "@/pages/StaffManagement";
import RolesManagement from "@/pages/RolesManagement";
import RolePermissionsManagement from "@/pages/RolePermissionsManagement";
import DeviceManagement from "@/pages/DeviceManagement";
import ChildrenManagement from "@/pages/ChildrenManagement";
import ClassesManagement from "@/pages/ClassesManagement";
import AttendanceManagement from "@/pages/AttendanceManagement";
import EventsManagement from "@/pages/EventsManagement";
import MessagesManagement from "@/pages/MessagesManagement";
import ReportsManagement from "@/pages/ReportsManagement";
import OrganizationSettings from "@/pages/OrganizationSettings";
import SystemHealth from "@/pages/SystemHealth";

// Protected Route wrapper with correct path
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleGuard from "@/components/security/RoleGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/admin-dashboard" replace />
                </ProtectedRoute>
              } />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin-dashboard" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_system_health">
                    <AdminDashboard />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* User Management routes */}
              <Route path="/users-management" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_users">
                    <UsersManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/staff-management" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_users">
                    <StaffManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/roles-management" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_roles">
                    <RolesManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/role-permissions-management" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_permissions">
                    <RolePermissionsManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Device Management */}
              <Route path="/devices" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_devices">
                    <DeviceManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Children & Classes routes */}
              <Route path="/children" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_all_children">
                    <ChildrenManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/classes" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_classes">
                    <ClassesManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Attendance routes */}
              <Route path="/attendance" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_attendance">
                    <AttendanceManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Events routes */}
              <Route path="/events" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_events">
                    <EventsManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Communication routes */}
              <Route path="/messages" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_messages">
                    <MessagesManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Reports routes */}
              <Route path="/reports" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_basic_reports">
                    <ReportsManagement />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Settings routes */}
              <Route path="/organization-settings" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_organization_settings">
                    <OrganizationSettings />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/system-health" element={
                <ProtectedRoute>
                  <RoleGuard requiredPermission="view_system_health">
                    <SystemHealth />
                  </RoleGuard>
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
