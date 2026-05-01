
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/types/supabase";

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const navigateToDashboard = () => {
    if (!userRole) {
      navigate('/login');
      return;
    }

    switch (userRole) {
      case 'super_admin':
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'staff':
        navigate('/staff-dashboard');
        break;
      case 'teacher':
      case 'teacher_assistant':
        navigate('/teacher-dashboard');
        break;
      case 'kiosk':
        navigate('/check-in');
        break;
      case 'parent':
      default:
        navigate('/parent-dashboard');
        break;
    }
  };

  const getDashboardPath = (role?: AppRole | null): string => {
    const currentRole = role || userRole;
    
    switch (currentRole) {
      case 'super_admin':
      case 'admin':
        return '/admin-dashboard';
      case 'staff':
        return '/staff-dashboard';
      case 'teacher':
      case 'teacher_assistant':
        return '/teacher-dashboard';
      case 'kiosk':
        return '/check-in';
      case 'parent':
      default:
        return '/parent-dashboard';
    }
  };

  return {
    navigateToDashboard,
    getDashboardPath,
  };
};


