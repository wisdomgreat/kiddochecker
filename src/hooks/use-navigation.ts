
import { useNavigate } from "react-router-dom";

/**
 * Hook for general navigation throughout the application
 */
export const useNavigation = () => {
  const navigate = useNavigate();

  // Public pages
  const navigateToLanding = () => navigate("/landing");
  const navigateToLogin = () => navigate("/login");
  const navigateToRegister = () => navigate("/parent-registration");
  const navigateToAboutUs = () => navigate("/about-us");
  const navigateToPrivacyPolicy = () => navigate("/privacy-policy");
  const navigateToTermsOfService = () => navigate("/terms-of-service");
  const navigateToContactUs = () => navigate("/contact-us");
  const navigateToFAQ = () => navigate("/faq");

  // Admin and organization routes
  const navigateToAdminDashboard = () => navigate("/admin-dashboard");
  const navigateToOrganizationSetup = () => navigate("/organization-setup");
  const navigateToSettings = () => navigate("/settings");

  // User management routes
  const navigateToUsersManagement = () => navigate("/users-management");
  const navigateToStaffManagement = () => navigate("/staff-management");
  const navigateToRolesManagement = () => navigate("/roles-management");
  const navigateToRolePermissions = () => navigate("/role-permissions");

  // Class and attendance routes
  const navigateToClassesManagement = () => navigate("/classes-management");
  const navigateToAttendance = () => navigate("/attendance");

  // Events routes
  const navigateToEventsManagement = () => navigate("/events-management");
  const navigateToEventDetails = (eventId: string) => navigate(`/events/${eventId}`);

  // Check-in system routes
  const navigateToCheckInOut = () => navigate("/check-in-out");
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
  const navigateToReportsDashboard = () => navigate("/reports-dashboard");
  const navigateToAttendanceReport = () => navigate("/reports/attendance");

  // User profile
  const navigateToUserProfile = () => navigate("/user-profile");

  // Device management
  const navigateToKioskManagement = () => navigate("/kiosk-management");

  return {
    navigateToLanding,
    navigateToLogin,
    navigateToRegister,
    navigateToAboutUs,
    navigateToPrivacyPolicy,
    navigateToTermsOfService,
    navigateToContactUs,
    navigateToFAQ,
    
    // Admin and organization
    navigateToAdminDashboard,
    navigateToOrganizationSetup,
    navigateToSettings,
    
    // User management
    navigateToUsersManagement,
    navigateToStaffManagement,
    navigateToRolesManagement,
    navigateToRolePermissions,
    
    // Class and attendance
    navigateToClassesManagement,
    navigateToAttendance,
    
    // Events
    navigateToEventsManagement,
    navigateToEventDetails,
    
    // Check-in system
    navigateToCheckInOut,
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
    
    // User profile
    navigateToUserProfile,
    
    // Device management
    navigateToKioskManagement,
  };
};

export default useNavigation;
