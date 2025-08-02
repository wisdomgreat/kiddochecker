
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ParentRegistration from "./pages/ParentRegistration";
import Dashboard from "./pages/Dashboard";
import ParentDashboard from "./pages/ParentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StaffRealtimeDashboard from "./pages/StaffRealtimeDashboard";
import CheckInKiosk from "./pages/CheckInKiosk";
import CheckOutStation from "./pages/CheckOutStation";
import ChildrenManagement from "./pages/ChildrenManagement";
import ClassesManagement from "./pages/ClassesManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import UsersManagement from "./pages/UsersManagement";
import StaffManagement from "./pages/StaffManagement";
import EventsManagement from "./pages/EventsManagement";
import MessagesManagement from "./pages/MessagesManagement";
import OrganizationSettings from "./pages/OrganizationSettings";
import RolePermissionsManagement from "./pages/RolePermissionsManagement";
import HelpDocumentation from "./pages/HelpDocumentation";
import DeviceManagement from "./pages/DeviceManagement";
import SystemHealth from "./pages/SystemHealth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/parent-registration" element={<ParentRegistration />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/parent-dashboard" element={<ParentDashboard />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/staff-realtime-dashboard" element={<StaffRealtimeDashboard />} />
              <Route path="/check-in-kiosk" element={<CheckInKiosk />} />
              <Route path="/check-out-station" element={<CheckOutStation />} />
              <Route path="/children" element={<ChildrenManagement />} />
              <Route path="/classes" element={<ClassesManagement />} />
              <Route path="/attendance" element={<AttendanceManagement />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/users-management" element={<UsersManagement />} />
              <Route path="/staff-management" element={<StaffManagement />} />
              <Route path="/roles-management" element={<RolePermissionsManagement />} />
              <Route path="/role-permissions-management" element={<RolePermissionsManagement />} />
              <Route path="/teachers" element={<StaffManagement />} />
              <Route path="/attendance-reports" element={<AttendanceManagement />} />
              <Route path="/kiosk" element={<CheckInKiosk />} />
              <Route path="/calendar" element={<EventsManagement />} />
              <Route path="/event-registration" element={<EventsManagement />} />
              <Route path="/announcements" element={<MessagesManagement />} />
              <Route path="/notifications" element={<MessagesManagement />} />
              <Route path="/analytics" element={<AttendanceManagement />} />
              <Route path="/export" element={<AttendanceManagement />} />
              <Route path="/devices" element={<DeviceManagement />} />
              <Route path="/system-health" element={<SystemHealth />} />
              <Route path="/integrations" element={<OrganizationSettings />} />
              <Route path="/organization-settings" element={<OrganizationSettings />} />
              <Route path="/security-settings" element={<OrganizationSettings />} />
              <Route path="/backup" element={<OrganizationSettings />} />
              <Route path="/events" element={<EventsManagement />} />
              <Route path="/messages" element={<MessagesManagement />} />
              <Route path="/organization" element={<OrganizationSettings />} />
              <Route path="/roles" element={<RolePermissionsManagement />} />
              <Route path="/reports" element={<AttendanceManagement />} />
              <Route path="/help" element={<HelpDocumentation />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
