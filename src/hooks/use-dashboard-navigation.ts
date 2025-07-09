
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export const useDashboardNavigation = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

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
        console.warn('Unknown role, redirecting to login:', userRole);
        navigate('/login');
    }
  };

  const getDashboardPath = () => {
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
    getDashboardPath
  };
};
