import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, loading, isMfaPending } = useAuth();

  useEffect(() => {
    console.log('Index page - User:', user?.id, 'Role:', userRole, 'Loading:', loading);
    
    if (loading) return;

    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // MFA logic removed - now handled by MFABarrier globally
  }, [user, loading, navigate]);

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

  if (!user) {
    return null;
  }

  // Show unified dashboard for authenticated users
  return (
    <UnifiedDashboardLayout>
      <UnifiedDashboard />
    </UnifiedDashboardLayout>
  );
};

export default Index;
