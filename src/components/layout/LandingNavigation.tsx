
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

const LandingNavigation = ({ className }: { className?: string }) => {
  const { user, userRole } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  
  return (
    <nav className={cn("flex items-center justify-between p-4 bg-white shadow-sm", className)}>
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <span className="font-bold text-xl ml-2">KidCheck</span>
      </div>
      
      <div className="hidden md:flex space-x-6">
        <Link to="/about-us" className="text-gray-700 hover:text-purple-700 font-medium">About</Link>
        <Link to="/faq" className="text-gray-700 hover:text-purple-700 font-medium">FAQ</Link>
        <Link to="/contact-us" className="text-gray-700 hover:text-purple-700 font-medium">Contact</Link>
      </div>
      
      <div className="flex items-center space-x-3">
        {user ? (
          <>
            <Button variant="ghost" onClick={navigateToDashboard}>
              {userRole === "admin" || userRole === "super_admin"
                ? "Admin Dashboard"
                : userRole === "teacher" || userRole === "teacher_assistant" || userRole === "staff"
                ? "Teacher Dashboard"
                : "Parent Dashboard"
              }
            </Button>
            <Button onClick={navigateToDashboard}>My Dashboard</Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/parent-registration">
              <Button>Register</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default LandingNavigation;
