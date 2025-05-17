
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { Menu, X } from "lucide-react";

const LandingNavigation = ({ className }: { className?: string }) => {
  const { user, userRole } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get the right dashboard name based on user role
  const getDashboardName = () => {
    if (userRole === "admin" || userRole === "super_admin") {
      return "Admin Dashboard";
    } else if (userRole === "teacher" || userRole === "teacher_assistant" || userRole === "staff") {
      return "Teacher Dashboard";
    } else {
      return "Parent Dashboard";
    }
  };
  
  return (
    <nav className={cn("flex items-center justify-between p-4 bg-white shadow-sm", className)}>
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-xl ml-2">KidCheck</span>
        </Link>
      </div>
      
      {/* Desktop navigation */}
      <div className="hidden md:flex space-x-6">
        <Link to="/about-us" className="text-gray-700 hover:text-purple-700 font-medium">About</Link>
        <Link to="/faq" className="text-gray-700 hover:text-purple-700 font-medium">FAQ</Link>
        <Link to="/contact-us" className="text-gray-700 hover:text-purple-700 font-medium">Contact</Link>
      </div>
      
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-700"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
      
      {/* Authentication buttons */}
      <div className="hidden md:flex items-center space-x-3">
        {user ? (
          <Button onClick={navigateToDashboard} variant="default">
            Go to {getDashboardName()}
          </Button>
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
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md z-50 py-4 px-6 flex flex-col space-y-4">
          <Link to="/about-us" className="text-gray-700 hover:text-purple-700 font-medium py-2">About</Link>
          <Link to="/faq" className="text-gray-700 hover:text-purple-700 font-medium py-2">FAQ</Link>
          <Link to="/contact-us" className="text-gray-700 hover:text-purple-700 font-medium py-2">Contact</Link>
          <div className="border-t border-gray-200 pt-4">
            {user ? (
              <Button 
                onClick={() => {
                  navigateToDashboard();
                  setMobileMenuOpen(false);
                }} 
                variant="default" 
                className="w-full"
              >
                Go to {getDashboardName()}
              </Button>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link to="/parent-registration" className="w-full">
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavigation;
