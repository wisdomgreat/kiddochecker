
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
    if (!loading && user && userRole) {
      const isOnLoginPage = location.pathname === '/login';
      const isOnLandingPage = location.pathname === '/landing';
      const isOnRegisterPage = location.pathname === '/parent-registration';
      const isOnCheckInKiosk = location.pathname === '/check-in-kiosk';
      const isOnCheckOutStation = location.pathname === '/check-out-station';
      
      // Don't redirect if on kiosk/station pages or already on correct dashboard
      if (isOnCheckInKiosk || isOnCheckOutStation) {
        return;
      }
      
      if (isOnLoginPage || isOnLandingPage || isOnRegisterPage) {
        navigateToDashboard();
      }
    }
  }, [user, userRole, loading, location.pathname, navigateToDashboard]);

  return <>{children}</>;
};
