
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

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

// Check-in related pages
import CheckInProcessPage from '@/pages/CheckInProcessPage';
import CheckOutProcessPage from '@/pages/CheckOutProcessPage';
import CheckInSetupPage from '@/pages/CheckInSetupPage';

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
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Main Dashboard Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/children" element={<ChildrenPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/check-in-out" element={<CheckInOutPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              
              {/* Check-in/out Process Routes */}
              <Route path="/check-in-process" element={<CheckInProcessPage />} />
              <Route path="/check-out-process" element={<CheckOutProcessPage />} />
              <Route path="/check-in-setup" element={<CheckInSetupPage />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
