
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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
      default:
        navigate('/parent-dashboard');
        break;
    }
  };

  const getDashboardPath = (role?: AppRole | null): string => {
    const currentRole = role || userRole;
    
    switch (currentRole) {
      case 'admin':
      case 'super_admin':
        return '/admin-dashboard';
      case 'staff':
      case 'teacher':
      case 'teacher_assistant':
        return '/staff-dashboard';
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
