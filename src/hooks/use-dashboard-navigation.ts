
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCallback, useMemo } from 'react';

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const dashboardPath = useMemo(() => {
    if (!userRole) return '/landing';
    
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        return '/admin-dashboard';
      case 'teacher':
      case 'teacher_assistant':
      case 'staff':
        return '/teacher-dashboard';
      case 'parent':
        return '/parent-dashboard';
      default:
        return '/';
    }
  }, [userRole]);

  const navigateToDashboard = useCallback(() => {
    console.log('Navigating to dashboard for role:', userRole, 'Path:', dashboardPath);
    navigate(dashboardPath, { replace: true });
  }, [navigate, dashboardPath, userRole]);

  return { navigateToDashboard, dashboardPath };
};

export default useDashboardNavigation;
