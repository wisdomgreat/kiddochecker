
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/pages/AdminDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import ParentDashboard from '@/pages/ParentDashboard';
import CheckInKiosk from '@/pages/CheckInKiosk';
import CheckOutStation from '@/pages/CheckOutStation';
import ClassesManagement from '@/pages/ClassesManagement';
import UsersManagement from '@/pages/UsersManagement';
import TeacherProfile from '@/pages/TeacherProfile';
import ReportsDashboard from '@/pages/ReportsDashboard';
import UserProfile from '@/pages/UserProfile';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ParentRegistration from '@/pages/ParentRegistration';
import CheckInProcess from '@/pages/CheckInProcess';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import OrganizationSetup from '@/pages/OrganizationSetup';
import StaffManagement from '@/pages/StaffManagement';
import EventsManagement from '@/pages/EventsManagement';
import KioskManagement from '@/pages/KioskManagement';
import RolesManagement from '@/pages/RolesManagement';
import RolePermissionsManagement from '@/pages/RolePermissionsManagement';
import CheckInOutManagement from '@/pages/CheckInOutManagement';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Toaster } from '@/components/ui/toaster';

// New footer pages
import AboutUs from '@/pages/AboutUs';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import ContactUs from '@/pages/ContactUs';
import FAQ from '@/pages/FAQ';

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

function App() {
  const { user, userRole, isLoading, isSetupComplete, refreshSession } = useAuth();
  const location = useLocation();

  console.log("App.tsx - Current user role:", userRole);
  console.log("App.tsx - Current path:", location.pathname);
  
  // Force a refresh session when app loads or route changes
  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !user) {
        console.log("App.tsx: Refreshing session on route change");
        await refreshSession();
      }
    };
    
    checkAuth();
  }, [location.pathname]);

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

  // Show loading indicator only during the initial app load
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress size="large" />
        <span className="mt-4 text-gray-600">Loading application...</span>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
        <Route path="/check-out-station" element={<CheckOutStation />} />
        <Route path="/organization-setup" element={<OrganizationSetup />} />
        <Route path="/parent-registration" element={<ParentRegistration />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        
        {/* Footer pages */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/faq" element={<FAQ />} />
        
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="index" element={<Navigate to={getDefaultRoute()} replace />} />
        
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
            <StaffManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/classes-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant']}>
            <ClassesManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/events-management" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
            <EventsManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/check-in-out" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
            <CheckInOutManagement />
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
        
        <Route path="/teacher-profile" element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff']}>
            <TeacherProfile />
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
        
        <Route path="/check-in-process" element={<CheckInProcess />} />
        
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
