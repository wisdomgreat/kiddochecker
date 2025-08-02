
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardNavigation } from '@/hooks/use-dashboard-navigation';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthRedirectHandlerProps {
  children: React.ReactNode;
}

export const AuthRedirectHandler = ({ children }: AuthRedirectHandlerProps) => {
  const { user, userRole, loading } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      const isOnLoginPage = location.pathname === '/login';
      const isOnLandingPage = location.pathname === '/landing';
      const isOnRegisterPage = location.pathname === '/parent-registration';
      const isOnRootPage = location.pathname === '/';
      const isOnCheckInKiosk = location.pathname === '/check-in-kiosk';
      const isOnCheckOutStation = location.pathname === '/check-out-station';
      
      // Don't redirect if on kiosk/station pages
      if (isOnCheckInKiosk || isOnCheckOutStation) {
        return;
      }
      
      // Redirect to appropriate dashboard if on login/landing/register/root pages
      if (isOnLoginPage || isOnLandingPage || isOnRegisterPage || isOnRootPage) {
        console.log('Redirecting user to dashboard, role:', userRole);
        navigateToDashboard();
      }
    }
  }, [user, userRole, loading, location.pathname, navigateToDashboard]);

  return <>{children}</>;
};
