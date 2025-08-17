
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && userRole) {
      // Route based on user role
      switch (userRole) {
        case 'super_admin':
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'staff':
        case 'teacher':
        case 'teacher_assistant':
          navigate('/staff', { replace: true });
          break;
        case 'parent':
          navigate('/parent', { replace: true });
          break;
        default:
          // Fallback to parent dashboard
          navigate('/parent', { replace: true });
          break;
      }
    } else if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  // Show loading while determining route
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
