
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const navigateToDashboard = () => {
    if (!userRole) {
      navigate('/landing', { replace: true });
      return;
    }

    if (userRole === 'admin' || userRole === 'super_admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (userRole === 'teacher' || userRole === 'teacher_assistant' || userRole === 'staff') {
      navigate('/teacher-dashboard', { replace: true });
    } else if (userRole === 'parent') {
      navigate('/parent-dashboard', { replace: true });
    } else {
      navigate('/landing', { replace: true });
    }
  };

  return { navigateToDashboard };
};
