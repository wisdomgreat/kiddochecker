
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
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
import EventsManagement from "./pages/EventsManagement";
import MessagesManagement from "./pages/MessagesManagement";
import OrganizationSettings from "./pages/OrganizationSettings";
import RolePermissionsManagement from "./pages/RolePermissionsManagement";
import HelpDocumentation from "./pages/HelpDocumentation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="/events" element={<EventsManagement />} />
            <Route path="/messages" element={<MessagesManagement />} />
            <Route path="/organization" element={<OrganizationSettings />} />
            <Route path="/roles" element={<RolePermissionsManagement />} />
            <Route path="/help" element={<HelpDocumentation />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
