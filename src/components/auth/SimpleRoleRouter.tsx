
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/CleanAuthContext';

export const SimpleRoleRouter = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;
    const isPublicRoute = ['/landing', '/login', '/parent-registration', '/checkin', '/checkout'].includes(currentPath);

    if (!user) {
      // User not logged in - redirect to landing if not on public route
      if (!isPublicRoute && currentPath !== '/') {
        navigate('/landing');
      } else if (currentPath === '/') {
        navigate('/landing');
      }
      return;
    }

    if (user && userRole) {
      // User is logged in with role
      if (isPublicRoute) {
        // Redirect away from public routes
        if (userRole === 'admin' || userRole === 'super_admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'parent') {
          navigate('/dashboard');
        } else if (userRole === 'staff' || userRole === 'teacher') {
          navigate('/admin/dashboard');
        }
        return;
      }

      // Check if user is on wrong dashboard
      const isOnAdminRoute = currentPath.startsWith('/admin');
      const isOnParentRoute = currentPath === '/dashboard' || currentPath.startsWith('/parent');

      if (userRole === 'parent' && isOnAdminRoute) {
        navigate('/dashboard');
      } else if ((userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff') && isOnParentRoute) {
        navigate('/admin/dashboard');
      }
    }
  }, [user, userRole, loading, location.pathname, navigate]);

  return null;
};
