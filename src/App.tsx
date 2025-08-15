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
import ManagementDashboard from '@/pages/ManagementDashboard';
import AdminUsersPage from '@/pages/AdminUsersPage';
import CheckInPage from '@/pages/CheckInPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
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
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/parent-registration" element={<ParentRegistration />} />
              <Route path="/check-in" element={<CheckInPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<Navigate to="/parent-dashboard" replace />} />
              <Route path="/parent-dashboard" element={<ParentDashboardPage />} />
              <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
              <Route path="/management" element={<ManagementDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/landing" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
