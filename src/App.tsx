
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Pages that we might create later
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
  const { user, userRole, isLoading } = useAuth();

  // Default redirect based on user role
  const getDefaultRoute = () => {
    if (!user) return '/landing';
    
    switch(userRole) {
      case 'admin':
        return '/admin-dashboard';
      case 'staff':
        return '/teacher-dashboard';
      case 'parent':
      default:
        return '/parent-dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading application...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - accessible to everyone */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
      <Route path="/organization-setup" element={<OrganizationSetup />} />
      <Route path="/parent-registration" element={<ParentRegistration />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      
      {/* Root path redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="index" element={<Navigate to={getDefaultRoute()} replace />} />
      
      {/* Admin routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/users-management" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <UsersManagement />
        </ProtectedRoute>
      } />
      <Route path="/staff-management" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <StaffManagement />
        </ProtectedRoute>
      } />
      <Route path="/classes-management" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ClassesManagement />
        </ProtectedRoute>
      } />
      <Route path="/reports-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ReportsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Teacher/Staff routes */}
      <Route path="/teacher-dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      <Route path="/teacher-profile" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <TeacherProfile />
        </ProtectedRoute>
      } />
      <Route path="/check-out-station" element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <CheckOutStation />
        </ProtectedRoute>
      } />
      
      {/* Parent routes */}
      <Route path="/parent-dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'parent']}>
          <ParentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/check-in-process" element={
        <ProtectedRoute allowedRoles={['admin', 'parent']}>
          <CheckInProcess />
        </ProtectedRoute>
      } />
      
      {/* Common routes accessible to all authenticated users */}
      <Route path="/user-profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      
      {/* Fall-through route */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
