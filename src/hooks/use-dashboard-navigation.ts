
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
        return '/dashboard';
    }
  }, [userRole]);

  const navigateToDashboard = useCallback(() => {
    console.log('Navigating to dashboard:', dashboardPath);
    navigate(dashboardPath);
  }, [navigate, dashboardPath]);

  return { navigateToDashboard, dashboardPath };
};

export default useDashboardNavigation;
