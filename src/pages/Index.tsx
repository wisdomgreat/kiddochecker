
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardNavigation } from '@/hooks/use-dashboard-navigation';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && userRole) {
        navigateToDashboard();
      } else {
        navigate('/login');
      }
    }
  }, [user, userRole, loading, navigateToDashboard, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
