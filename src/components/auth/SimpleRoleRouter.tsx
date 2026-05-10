
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const SimpleRoleRouter = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;
    const isPublicRoute = ['/landing', '/login', '/parent-registration', '/checkin', '/checkout'].includes(currentPath);
    const isRootRoute = currentPath === '/';

    console.log('SimpleRoleRouter - User:', user?.id, 'Role:', userRole, 'Current path:', currentPath);

    if (!user) {
      // User not logged in - redirect to landing if not on public route
      if (!isPublicRoute && !isRootRoute) {
        console.log('Redirecting unauthenticated user to landing');
        navigate('/landing');
      } else if (isRootRoute) {
        navigate('/landing');
      }
      return;
    }

    if (user && userRole) {
      // User is logged in with role
      if (isPublicRoute || isRootRoute) {
        // Redirect away from public routes based on role
        if (userRole === 'admin' || userRole === 'super_admin') {
          console.log('Redirecting admin from public route to admin dashboard');
          navigate('/admin/dashboard');
        } else if (userRole === 'parent') {
          console.log('Redirecting parent from public route to parent dashboard');
          navigate('/dashboard');
        } else if (userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant') {
          console.log('Redirecting staff/teacher from public route to admin dashboard');
          navigate('/admin/dashboard');
        }
        return;
      }

      // Check if user is on wrong dashboard type
      const isOnAdminRoute = currentPath.startsWith('/admin');
      const isOnParentRoute = currentPath === '/dashboard' || currentPath.startsWith('/parent');

      // Role-based routing corrections
      if (userRole === 'parent' && isOnAdminRoute) {
        console.log('Redirecting parent away from admin area');
        navigate('/dashboard');
      } else if ((userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant') && isOnParentRoute) {
        console.log('Redirecting admin/staff away from parent area');
        navigate('/admin/dashboard');
      }
    }
  }, [user, userRole, loading, location.pathname, navigate]);

  return null;
};

