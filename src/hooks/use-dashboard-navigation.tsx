
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const navigateToDashboard = () => {
    if (userRole === 'admin' || userRole === 'super_admin') {
      navigate('/admin-dashboard');
    } else if (userRole === 'teacher' || userRole === 'teacher_assistant' || userRole === 'staff') {
      navigate('/teacher-dashboard');
    } else if (userRole === 'parent') {
      navigate('/parent-dashboard');
    } else {
      navigate('/landing');
    }
  };

  const navigateToAdminDashboard = () => {
    navigate('/admin-dashboard');
  };

  const navigateToTeacherDashboard = () => {
    navigate('/teacher-dashboard');
  };

  const navigateToParentDashboard = () => {
    navigate('/parent-dashboard');
  };

  const navigateToClasses = () => {
    navigate('/classes-management');
  };

  const navigateToEvents = () => {
    navigate('/events-management');
  };

  const navigateToUsers = () => {
    navigate('/users-management');
  };

  const navigateToCheckInOut = () => {
    navigate('/check-in-out');
  };

  const navigateToReports = () => {
    navigate('/reports-dashboard');
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  const navigateToProfile = () => {
    navigate('/user-profile');
  };

  return {
    navigateToDashboard,
    navigateToAdminDashboard,
    navigateToTeacherDashboard,
    navigateToParentDashboard,
    navigateToClasses,
    navigateToEvents,
    navigateToUsers,
    navigateToCheckInOut,
    navigateToReports,
    navigateToSettings,
    navigateToProfile,
  };
};

export default useDashboardNavigation;
