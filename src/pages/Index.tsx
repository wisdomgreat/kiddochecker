import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    console.log('Index page - User:', user?.id, 'Role:', userRole, 'Loading:', loading);
    
    if (loading) return;

    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // If we have a user and role (or waiting for role), show the unified dashboard
    // No more redirects - just show the appropriate dashboard content
  }, [user, userRole, loading, navigate]);

  // Show loading while determining authentication state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if no user
  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  // Show unified dashboard for authenticated users
  return (
    <UnifiedDashboardLayout>
      <UnifiedDashboard />
    </UnifiedDashboardLayout>
  );
};

export default Index;
