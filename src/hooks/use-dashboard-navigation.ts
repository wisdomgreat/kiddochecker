
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const navigateToDashboard = useCallback(() => {
    if (!userRole) return;
    
    if (userRole === 'admin' || userRole === 'super_admin') {
      navigate('/dashboard');
    } else if (userRole === 'teacher' || userRole === 'teacher_assistant' || userRole === 'staff') {
      navigate('/dashboard');
    } else if (userRole === 'parent') {
      navigate('/parent-dashboard');
    } else {
      navigate('/landing');
    }
  }, [navigate, userRole]);

  return { navigateToDashboard };
};

export default useDashboardNavigation;
