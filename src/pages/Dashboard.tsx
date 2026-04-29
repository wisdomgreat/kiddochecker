
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard page - User:', user?.id, 'Role:', userRole, 'Loading:', loading);
    
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // This is likely an old route - redirect to root to let Index handle it
      navigate('/', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;

