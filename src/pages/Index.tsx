import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

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

    if (user && userRole) {
      console.log('User authenticated with role, redirecting to appropriate dashboard');
      
      // Direct navigation based on role
      switch (userRole) {
        case 'super_admin':
        case 'admin':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'staff':
        case 'teacher':
        case 'teacher_assistant':
          navigate('/staff-dashboard', { replace: true });
          break;
        case 'parent':
          navigate('/parent-dashboard', { replace: true });
          break;
        default:
          console.log('Unknown role, defaulting to parent dashboard');
          navigate('/parent-dashboard', { replace: true });
          break;
      }
    } else if (user && !userRole) {
      console.log('User exists but no role determined yet, waiting...');
      // Keep showing loading state while role is being determined
    }
  }, [user, userRole, loading, navigate]);

  // Show loading while determining route
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : user && !userRole ? 'Setting up your account...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
};

export default Index;
