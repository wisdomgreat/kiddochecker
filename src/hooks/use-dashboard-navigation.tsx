
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook for navigating between different dashboard screens based on user role
 */
export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Navigation function that redirects based on user role
  const navigateToDashboard = () => {
    if (!userRole) {
      console.log("No user role found, navigating to landing");
      navigate('/landing');
      return;
    }
    
    console.log(`Navigating based on role: ${userRole}`);
    
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        navigate('/admin-dashboard');
        break;
      case 'teacher':
      case 'teacher_assistant':
      case 'staff':
        navigate('/teacher-dashboard');
        break;
      case 'parent':
        navigate('/parent-dashboard');
        break;
      default:
        navigate('/landing');
    }
  };

  // Direct navigation functions for specific dashboards
  const navigateToAdminDashboard = () => navigate('/admin-dashboard');
  const navigateToTeacherDashboard = () => navigate('/teacher-dashboard');
  const navigateToParentDashboard = () => navigate('/parent-dashboard');
  
  // Feature-specific navigation functions
  const navigateToClasses = () => navigate('/classes-management');
  const navigateToEvents = () => navigate('/events-management');
  const navigateToUsers = () => navigate('/users-management');
  const navigateToCheckInOut = () => navigate('/check-in-out');
  const navigateToReports = () => navigate('/reports-dashboard');
  const navigateToSettings = () => navigate('/settings');
  const navigateToProfile = () => navigate('/user-profile');
  const navigateToLogin = () => navigate('/login');
  const navigateToLanding = () => navigate('/landing');
  const navigateToStaffManagement = () => navigate('/staff-management');
  const navigateToRolesManagement = () => navigate('/roles-management');
  const navigateToCheckInKiosk = () => navigate('/check-in-kiosk');

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
    navigateToLogin,
    navigateToLanding,
    navigateToStaffManagement,
    navigateToRolesManagement,
    navigateToCheckInKiosk,
  };
};

export default useDashboardNavigation;
