
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
      const isOnRegisterPage = location.pathname === '/parent-registration';
      const isOnRootPage = location.pathname === '/';
      const isOnSetupPage = location.pathname === '/organization-setup';
      const isOnCheckInKiosk = location.pathname === '/checkin';
      const isOnCheckOutStation = location.pathname === '/checkout';
      
      // Don't redirect if on kiosk/station pages
      if (isOnCheckInKiosk || isOnCheckOutStation) {
        return;
      }
      
      // Don't redirect if on setup page and user is admin/super_admin
      if (isOnSetupPage && (userRole === 'admin' || userRole === 'super_admin')) {
        return;
      }
      
      // Redirect to appropriate dashboard if on login/register/root pages
      if (isOnLoginPage || isOnRegisterPage || isOnRootPage) {
        console.log('Redirecting authenticated user to dashboard, role:', userRole);
        navigateToDashboard();
      }
    } else if (!loading && !user) {
      // Redirect unauthenticated users to landing page only if they're trying to access protected routes
      const publicRoutes = ['/landing', '/login', '/parent-registration', '/organization-setup'];
      const isOnRootPage = location.pathname === '/';
      
      // If user is on root page, redirect to landing
      if (isOnRootPage) {
        navigate('/landing');
        return;
      }
      
      // If user is trying to access a protected route, redirect to landing
      if (!publicRoutes.includes(location.pathname)) {
        navigate('/landing');
      }
    }
  }, [user, userRole, loading, location.pathname, navigateToDashboard, navigate]);

  return <>{children}</>;
};
