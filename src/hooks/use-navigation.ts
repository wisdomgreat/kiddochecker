
import { useNavigate } from "react-router-dom";

export const useNavigation = () => {
  const navigate = useNavigate();

  // Admin and organization routes
  const navigateToAdminDashboard = () => navigate("/admin-dashboard");
  const navigateToOrganizationSetup = () => navigate("/organization-setup");
  const navigateToSettings = () => navigate("/settings");

  // User management routes
  const navigateToUsersManagement = () => navigate("/users-management");
  const navigateToStaffManagement = () => navigate("/staff-management");
  const navigateToRolesManagement = () => navigate("/roles-management");

  // Class and attendance routes
  const navigateToClassesManagement = () => navigate("/classes-management");
  const navigateToAttendance = () => navigate("/attendance");

  // Events routes
  const navigateToEventsManagement = () => navigate("/events-management");
  const navigateToEventDetails = (eventId: string) => navigate(`/events/${eventId}`);

  // Check-in system routes
  const navigateToCheckInKiosk = () => navigate("/check-in-kiosk");
  const navigateToCheckOutStation = () => navigate("/check-out-station");
  const navigateToCheckInProcess = () => navigate("/check-in-process");

  // Parent dashboard routes
  const navigateToParentDashboard = () => navigate("/parent-dashboard");
  const navigateToChildrenManagement = () => navigate("/children-management");
  const navigateToFamilySettings = () => navigate("/family-settings");

  // Teacher routes
  const navigateToTeacherDashboard = () => navigate("/teacher-dashboard");
  const navigateToClassAttendance = (classId: string) => navigate(`/class/${classId}/attendance`);

  // Report routes
  const navigateToReportsDashboard = () => navigate("/reports");
  const navigateToAttendanceReport = () => navigate("/reports/attendance");

  // Authentication routes
  const navigateToLogin = () => navigate("/login");
  const navigateToRegister = () => navigate("/register");
  const navigateToForgotPassword = () => navigate("/forgot-password");

  return {
    // Admin and organization
    navigateToAdminDashboard,
    navigateToOrganizationSetup,
    navigateToSettings,
    
    // User management
    navigateToUsersManagement,
    navigateToStaffManagement,
    navigateToRolesManagement,
    
    // Class and attendance
    navigateToClassesManagement,
    navigateToAttendance,
    
    // Events
    navigateToEventsManagement,
    navigateToEventDetails,
    
    // Check-in system
    navigateToCheckInKiosk,
    navigateToCheckOutStation,
    navigateToCheckInProcess,
    
    // Parent dashboard
    navigateToParentDashboard,
    navigateToChildrenManagement,
    navigateToFamilySettings,
    
    // Teacher
    navigateToTeacherDashboard,
    navigateToClassAttendance,
    
    // Reports
    navigateToReportsDashboard,
    navigateToAttendanceReport,
    
    // Authentication
    navigateToLogin,
    navigateToRegister,
    navigateToForgotPassword,
  };
};

export default useNavigation;
