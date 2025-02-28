
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CheckOutStation from "./pages/CheckOutStation";
import ClassesManagement from "./pages/ClassesManagement";
import UsersManagement from "./pages/UsersManagement";
import UserProfile from "./pages/UserProfile";
import TeacherProfile from "./pages/TeacherProfile";
import ParentDashboard from "./pages/ParentDashboard";
import ReportsDashboard from "./pages/ReportsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/check-out" element={<CheckOutStation />} />
          <Route path="/classes" element={<ClassesManagement />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/reports" element={<ReportsDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
