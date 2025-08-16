
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const RoleBasedRedirect = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;

    console.log('RoleBasedRedirect - User:', user.id, 'Role:', userRole, 'Current path:', location.pathname);

    // Don't redirect if already on the correct page
    const isOnLoginPage = location.pathname === '/login';
    const isOnAdminPage = location.pathname.startsWith('/admin');
    const isOnParentPage = location.pathname.startsWith('/parent') || location.pathname === '/dashboard';

    if (!isOnLoginPage) {
      // User is already logged in and not on login page
      if (userRole === 'admin' || userRole === 'super_admin') {
        if (!isOnAdminPage) {
          console.log('Redirecting admin user to admin dashboard');
          navigate('/admin/dashboard', { replace: true });
        }
      } else if (userRole === 'parent') {
        if (!isOnParentPage) {
          console.log('Redirecting parent user to parent dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else if (userRole === 'staff' || userRole === 'teacher') {
        if (!isOnAdminPage) {
          console.log('Redirecting staff/teacher to admin dashboard');
          navigate('/admin/dashboard', { replace: true });
        }
      }
    } else if (isOnLoginPage && userRole) {
      // User is on login page but already has a role - redirect them
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher') {
        console.log('Redirecting authenticated admin/staff from login to admin dashboard');
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'parent') {
        console.log('Redirecting authenticated parent from login to parent dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, loading, location.pathname, navigate]);

  return null; // This component doesn't render anything
};
