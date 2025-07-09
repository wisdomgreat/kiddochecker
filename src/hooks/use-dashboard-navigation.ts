
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const navigateToDashboard = () => {
    console.log('Navigating to dashboard for role:', userRole);
    
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        navigate('/admin-dashboard');
        break;
      case 'staff':
      case 'teacher':
      case 'teacher_assistant':
        navigate('/staff-dashboard');
        break;
      case 'parent':
        navigate('/parent-dashboard');
        break;
      default:
        console.log('Unknown role, redirecting to login');
        navigate('/login');
    }
  };

  const getDefaultRoute = () => {
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        return '/admin-dashboard';
      case 'staff':
      case 'teacher':
      case 'teacher_assistant':
        return '/staff-dashboard';
      case 'parent':
        return '/parent-dashboard';
      default:
        return '/login';
    }
  };

  return {
    navigateToDashboard,
    getDefaultRoute,
  };
};
