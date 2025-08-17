
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

    console.log('SimpleRoleRouter - User:', user?.id, 'Role:', userRole, 'Current path:', currentPath);

    if (!user) {
      // User not logged in - redirect to landing if not on public route
      if (!isPublicRoute && currentPath !== '/') {
        console.log('Redirecting unauthenticated user to landing');
        navigate('/landing');
      } else if (currentPath === '/') {
        navigate('/landing');
      }
      return;
    }

    if (user && userRole) {
      // User is logged in with role
      if (isPublicRoute) {
        // Redirect away from public routes based on role
        if (userRole === 'admin' || userRole === 'super_admin') {
          console.log('Redirecting admin from public route to admin dashboard');
          navigate('/admin/dashboard');
        } else if (userRole === 'parent') {
          console.log('Redirecting parent from public route to parent dashboard');
          navigate('/dashboard');
        } else if (userRole === 'staff' || userRole === 'teacher') {
          console.log('Redirecting staff/teacher from public route to admin dashboard');
          navigate('/admin/dashboard');
        }
        return;
      }

      // Check if user is on wrong dashboard type
      const isOnAdminRoute = currentPath.startsWith('/admin');
      const isOnParentRoute = currentPath === '/dashboard' || currentPath.startsWith('/parent');

      // Strict role-based routing
      if (userRole === 'parent') {
        if (isOnAdminRoute) {
          console.log('Redirecting parent away from admin area');
          navigate('/dashboard');
        }
      } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher') {
        if (isOnParentRoute) {
          console.log('Redirecting admin/staff away from parent area');
          navigate('/admin/dashboard');
        }
      }
    }
  }, [user, userRole, loading, location.pathname, navigate]);

  return null;
};
