
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
      const isOnSetupPage = location.pathname === '/organization-setup';
      const isOnCheckInKiosk = location.pathname === '/check-in-kiosk';
      const isOnCheckOutStation = location.pathname === '/check-out-station';
      
      // Don't redirect if on kiosk/station pages
      if (isOnCheckInKiosk || isOnCheckOutStation) {
        return;
      }
      
      // Don't redirect if on setup page and user is admin/super_admin
      if (isOnSetupPage && (userRole === 'admin' || userRole === 'super_admin')) {
        return;
      }
      
      // Redirect to appropriate dashboard if on login/landing/register/root pages
      if (isOnLoginPage || isOnLandingPage || isOnRegisterPage || isOnRootPage) {
        console.log('Redirecting user to dashboard, role:', userRole);
        navigateToDashboard();
      }
    } else if (!loading && !user) {
      // Redirect unauthenticated users to landing page if they're on protected routes
      const publicRoutes = ['/landing', '/login', '/parent-registration', '/organization-setup'];
      if (!publicRoutes.includes(location.pathname)) {
        navigate('/landing');
      }
    }
  }, [user, userRole, loading, location.pathname, navigateToDashboard, navigate]);

  return <>{children}</>;
};
