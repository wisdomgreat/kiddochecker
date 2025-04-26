
import { useNavigate } from "react-router-dom";

export const useNavigation = () => {
  const navigate = useNavigate();
  
  const goTo = (path: string) => {
    navigate(path);
  };
  
  return {
    goTo,
    navigateToAdminDashboard: () => goTo("/admin-dashboard"),
    navigateToTeacherDashboard: () => goTo("/teacher-dashboard"),
    navigateToParentDashboard: () => goTo("/parent-dashboard"),
    navigateToStaffManagement: () => goTo("/staff-management"),
    navigateToUsersManagement: () => goTo("/users-management"),
    navigateToClassesManagement: () => goTo("/classes-management"),
    navigateToEventsManagement: () => goTo("/events-management"),
    navigateToReportsDashboard: () => goTo("/reports-dashboard"),
    navigateToSettings: () => goTo("/settings"),
    navigateToCheckInKiosk: () => goTo("/check-in-kiosk"),
    navigateToUserProfile: () => goTo("/user-profile"),
    navigateToCheckInOut: () => goTo("/check-in-out"),
    navigateToRolesManagement: () => goTo("/roles-management"),
    navigateToKioskManagement: () => goTo("/kiosk-management"),
  };
};
