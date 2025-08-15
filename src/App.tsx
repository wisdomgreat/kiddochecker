
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// Import pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ParentRegistration from '@/pages/ParentRegistration';

// Import layout and components
import MobileFirstLayout from '@/components/layout/MobileFirstLayout';
import CleanAdminDashboard from '@/components/admin/CleanAdminDashboard';
import CleanParentDashboard from '@/components/parent/CleanParentDashboard';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import ParentChildManagement from '@/components/parent/ParentChildManagement';
import { useAuth } from '@/context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <MobileFirstLayout>{children}</MobileFirstLayout>;
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { userRole, loading, isAdmin, isParent } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Clear role-based redirection
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (isParent) {
    return <Navigate to="/parent-dashboard" replace />;
  } else {
    // If no role is detected, redirect to login
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/parent-registration" element={<ParentRegistration />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard" element={<ProtectedRoute><CleanAdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold text-left">Reports</h1><p className="text-left">Feature coming soon...</p></div></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold text-left">Settings</h1><p className="text-left">Feature coming soon...</p></div></ProtectedRoute>} />
              
              {/* Parent Routes */}
              <Route path="/parent-dashboard" element={<ProtectedRoute><CleanParentDashboard /></ProtectedRoute>} />
              <Route path="/parent/children" element={<ProtectedRoute><ParentChildManagement /></ProtectedRoute>} />
              <Route path="/parent/attendance" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold text-left">Attendance</h1><p className="text-left">Feature coming soon...</p></div></ProtectedRoute>} />
              <Route path="/parent/messages" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold text-left">Messages</h1><p className="text-left">Feature coming soon...</p></div></ProtectedRoute>} />
              
              {/* Default redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
