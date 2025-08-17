
import { useEffect } from 'react';
import { useAuth } from '@/context/CleanAuthContext';
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
    if (loading) return;

    const isOnLoginPage = location.pathname === '/login';
    const isOnRegisterPage = location.pathname === '/parent-registration';
    const isOnRootPage = location.pathname === '/';
    const isOnLandingPage = location.pathname === '/landing';
    const isOnCheckInKiosk = location.pathname === '/checkin';
    const isOnCheckOutStation = location.pathname === '/checkout';
    
    if (isOnCheckInKiosk || isOnCheckOutStation) {
      return;
    }

    if (user && userRole) {
      console.log('User authenticated with role:', userRole);
      
      if (isOnLoginPage || isOnRegisterPage || isOnRootPage || isOnLandingPage) {
        console.log('Redirecting authenticated user to dashboard');
        navigateToDashboard();
      }
    } else {
      console.log('User not authenticated or no role');
      
      const publicRoutes = ['/landing', '/login', '/parent-registration'];
      
      if (isOnRootPage) {
        console.log('Redirecting to landing page from root');
        navigate('/landing');
      } else if (!publicRoutes.includes(location.pathname)) {
        console.log('Redirecting to landing page from protected route');
        navigate('/landing');
      }
    }
  }, [user, userRole, loading, location.pathname, navigateToDashboard, navigate]);

  return <>{children}</>;
};
