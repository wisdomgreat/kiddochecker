
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import AdminDashboard from '@/pages/AdminDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import ParentDashboard from '@/pages/ParentDashboard';
import CheckInKiosk from '@/pages/CheckInKiosk';
import CheckOutStation from '@/pages/CheckOutStation';
import UserProfile from '@/pages/UserProfile';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ParentRegistration from '@/pages/ParentRegistration';
import CheckInProcess from '@/pages/CheckInProcess';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import OrganizationSetup from '@/pages/OrganizationSetup';
import EventsManagement from '@/pages/EventsManagement';
import KioskManagement from '@/pages/KioskManagement';
import RolesManagement from '@/pages/RolesManagement';
import RolePermissionsManagement from '@/pages/RolePermissionsManagement';
import ReportsDashboard from '@/pages/ReportsDashboard';
import UsersManagement from '@/pages/UsersManagement';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Toaster } from '@/components/ui/toaster';

// Import new refactored pages
import CheckInOutPage from '@/pages/CheckInOutPage';
import StaffPage from '@/pages/StaffPage';
import ChildrenPage from '@/pages/ChildrenPage';
import ClassesPage from '@/pages/ClassesPage';

const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
    <p className="mb-6">You don't have permission to access this page.</p>
    <button 
      onClick={() => window.history.back()} 
      className="px-4 py-2 bg-blue-600 text-white rounded-md"
    >
      Go Back
    </button>
  </div>
);

function AppContent() {
  const { user, userRole, isLoading, isSetupComplete } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  console.log("App.tsx - Current user:", user?.id || "none");
  console.log("App.tsx - Current user role:", userRole);
  console.log("App.tsx - Current path:", location.pathname);
  
  const getDefaultRoute = () => {
    if (!user) return '/landing';
    
    if (isSetupComplete === false && (userRole === 'admin' || userRole === 'super_admin')) {
      return '/organization-setup';
    }
    
    switch(userRole) {
      case 'admin':
      case 'super_admin':
        return '/admin-dashboard';
      case 'teacher':
      case 'teacher_assistant':
      case 'staff':
        return '/teacher-dashboard';
      case 'parent':
        return '/parent-dashboard';
      default:
        return '/landing';
    }
  };

  useEffect(() => {
    if (!isLoading && user && userRole && (location.pathname === '/' || location.pathname === '')) {
      const targetRoute = getDefaultRoute();
      console.log("App.tsx - Redirecting from / to:", targetRoute);
      navigate(targetRoute, { replace: true });
    }
  }, [user, userRole, isLoading, location.pathname, navigate, isSetupComplete]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress size="large" />
        <span className="mt-4 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/parent-registration" element={<ParentRegistration />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        
        {/* Kiosk routes */}
        <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
        <Route path="/check-out-station" element={<CheckOutStation />} />
        <Route path="/check-in-process" element={<CheckInProcess />} />
        
        {/* Organization setup route */}
        <Route path="/organization-setup" element={<OrganizationSetup />} />
        
        {/* Default route */}
        <Route path="/" element={
          user && userRole ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <Navigate to="/landing" replace />
          )
        } />
        
        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/users-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <UsersManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/staff-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <StaffPage />
          </ProtectedRoute>
        } />
        
        <Route path="/children-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'parent']}>
            <ChildrenPage />
          </ProtectedRoute>
        } />
        
        <Route path="/classes-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant']}>
            <ClassesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/events-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
            <EventsManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/check-in-out" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
            <CheckInOutPage />
          </ProtectedRoute>
        } />
        
        <Route path="/kiosk-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <KioskManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/reports-dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <ReportsDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/roles-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <RolesManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/role-permissions" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <RolePermissionsManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* Teacher Routes */}
        <Route path="/teacher-dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        
        {/* Parent Routes */}
        <Route path="/parent-dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } />
        
        {/* Common Routes */}
        <Route path="/user-profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
