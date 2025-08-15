
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// Import pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ParentRegistration from '@/pages/ParentRegistration';
import ParentDashboardPage from '@/pages/ParentDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminUsersPage from '@/pages/AdminUsersPage';

// Import layout components
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
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
  
  return <ResponsiveLayout>{children}</ResponsiveLayout>;
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { userRole, loading } = useAuth();
  
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
  
  // Redirect based on role
  if (userRole === 'admin' || userRole === 'super_admin') {
    return <Navigate to="/admin-dashboard" replace />;
  } else {
    return <Navigate to="/parent-dashboard" replace />;
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
              <Route path="/parent-dashboard" element={<ProtectedRoute><ParentDashboardPage /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
              
              {/* Parent Routes */}
              <Route path="/parent/children" element={<ProtectedRoute><div className="p-6"><h1>My Children</h1><p>Feature coming soon...</p></div></ProtectedRoute>} />
              <Route path="/parent/attendance" element={<ProtectedRoute><div className="p-6"><h1>Attendance</h1><p>Feature coming soon...</p></div></ProtectedRoute>} />
              <Route path="/parent/messages" element={<ProtectedRoute><div className="p-6"><h1>Messages</h1><p>Feature coming soon...</p></div></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin/reports" element={<ProtectedRoute><div className="p-6"><h1>Reports</h1><p>Feature coming soon...</p></div></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><div className="p-6"><h1>Settings</h1><p>Feature coming soon...</p></div></ProtectedRoute>} />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/landing" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
