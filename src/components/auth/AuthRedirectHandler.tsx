
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardNavigation } from '@/hooks/use-dashboard-navigation';
import { useLocation } from 'react-router-dom';

interface AuthRedirectHandlerProps {
  children: React.ReactNode;
}

export const AuthRedirectHandler = ({ children }: AuthRedirectHandlerProps) => {
  const { user, userRole, loading } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user is authenticated and we have their role
    if (!loading && user && userRole) {
      // Don't redirect if already on the correct dashboard
      const isOnLoginPage = location.pathname === '/login';
      const isOnLandingPage = location.pathname === '/landing';
      const isOnRegisterPage = location.pathname === '/parent-registration';
      
      if (isOnLoginPage || isOnLandingPage || isOnRegisterPage) {
        console.log('Redirecting authenticated user from:', location.pathname, 'Role:', userRole);
        navigateToDashboard();
      }
    }
  }, [user, userRole, loading, location.pathname, navigateToDashboard]);

  return <>{children}</>;
};
