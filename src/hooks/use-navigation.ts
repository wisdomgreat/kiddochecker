
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
  const navigateToUsers = () => navigate("/users");
  const navigateToStaff = () => navigate("/staff");

  // Class and attendance routes
  const navigateToClasses = () => navigate("/classes");
  const navigateToAttendance = () => navigate("/attendance");

  // Events routes
  const navigateToCalendar = () => navigate("/calendar");
  const navigateToEventDetails = (eventId: string) => navigate(`/events/${eventId}`);

  // Check-in system routes
  const navigateToCheckInKiosk = () => navigate("/check-in");
  const navigateToCheckOutStation = () => navigate("/check-out");

  // Parent dashboard routes
  const navigateToParentDashboard = () => navigate("/parent-dashboard");
  const navigateToChildren = () => navigate("/children");
  const navigateToFamilySettings = () => navigate("/parent/profile");

  // Teacher routes
  const navigateToTeacherDashboard = () => navigate("/teacher-dashboard");
  const navigateToClassAttendance = (classId: string) => navigate(`/class/${classId}/attendance`);

  // Report routes
  const navigateToReports = () => navigate("/reports");

  // User profile
  const navigateToUserProfile = () => navigate("/user-profile");

  // Messages
  const navigateToMessages = () => navigate("/messages");

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
    navigateToUsers,
    navigateToStaff,

    // Class and attendance
    navigateToClasses,
    navigateToAttendance,

    // Events
    navigateToCalendar,
    navigateToEventDetails,

    // Check-in system
    navigateToCheckInKiosk,
    navigateToCheckOutStation,

    // Parent dashboard
    navigateToParentDashboard,
    navigateToChildren,
    navigateToFamilySettings,

    // Teacher
    navigateToTeacherDashboard,
    navigateToClassAttendance,

    // Reports
    navigateToReports,

    // User profile
    navigateToUserProfile,

    // Messages
    navigateToMessages,
  };
};

export default useNavigation;
