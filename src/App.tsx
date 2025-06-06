
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// Pages
import Dashboard from '@/pages/Dashboard';
import StaffPage from '@/pages/StaffPage';
import ChildrenPage from '@/pages/ChildrenPage';
import ClassesPage from '@/pages/ClassesPage';
import CheckInOutPage from '@/pages/CheckInOutPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersPage from '@/pages/UsersPage';
import RolesPage from '@/pages/RolesPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ParentRegistrationPage from '@/pages/ParentRegistrationPage';
import ParentDashboard from '@/pages/ParentDashboard';
import CalendarPage from '@/pages/CalendarPage';

// Check-in related pages
import CheckInProcessPage from '@/pages/CheckInProcessPage';
import CheckInSetupPage from '@/pages/CheckInSetupPage';
import CheckInKiosk from '@/pages/CheckInKiosk';

// Unique Features
import FamilyConnectPage from '@/pages/FamilyConnectPage';
import AttendanceRewardsPage from '@/pages/AttendanceRewardsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/parent-registration" element={<ParentRegistrationPage />} />
            <Route path="/" element={<Navigate to="/landing" />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <StaffPage />
              </ProtectedRoute>
            } />
            <Route path="/children" element={
              <ProtectedRoute>
                <ChildrenPage />
              </ProtectedRoute>
            } />
            <Route path="/classes" element={
              <ProtectedRoute>
                <ClassesPage />
              </ProtectedRoute>
            } />
            <Route path="/check-in-out" element={
              <ProtectedRoute>
                <CheckInOutPage />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'super_admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="/roles" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <RolesPage />
              </ProtectedRoute>
            } />
            
            {/* Check-in system Routes */}
            <Route path="/check-in-process" element={
              <ProtectedRoute>
                <CheckInProcessPage />
              </ProtectedRoute>
            } />
            <Route path="/check-in-setup" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <CheckInSetupPage />
              </ProtectedRoute>
            } />
            <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
            
            {/* Parent routes */}
            <Route path="/parent-dashboard" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            } />
            
            {/* Calendar */}
            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
            
            {/* Unique Features */}
            <Route path="/family-connect" element={
              <ProtectedRoute>
                <FamilyConnectPage />
              </ProtectedRoute>
            } />
            <Route path="/attendance-rewards" element={
              <ProtectedRoute>
                <AttendanceRewardsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
