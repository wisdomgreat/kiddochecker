
import { useState, useEffect } from "react";
import { User, ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/check-in/LoginForm";
import RegistrationPrompt from "@/components/check-in/RegistrationPrompt";
import AdminAccess from "@/components/check-in/AdminAccess";
import { Button } from "@/components/ui/button";

const CheckInKiosk = () => {
  const { user, userRole } = useAuth();
  const [organizationName, setOrganizationName] = useState("Your Church");
  const [hasOrganization, setHasOrganization] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<string>("Main Entrance");
  const [deviceType, setDeviceType] = useState<string>("check-in");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if organization exists
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        setIsChecking(true);
        // Use raw query since organization_settings is not in types yet
        const { data, error, count } = await supabase
          .from('organization_settings')
          .select('*', { count: 'exact' });
        
        if (error) throw error;
        
        if (count === 0) {
          setHasOrganization(false);
          toast({
            title: "No Organization Found",
            description: "Please set up your organization first.",
            variant: "destructive"
          });
          navigate("/organization-setup");
          return;
        }
        
        if (data && data.length > 0) {
          setOrganizationName(data[0].name);
        }
        
        setHasOrganization(true);
      } catch (error) {
        console.error("Error checking organization:", error);
        toast({
          title: "Setup Required",
          description: "Please set up your organization first.",
          variant: "destructive"
        });
        navigate("/organization-setup");
      } finally {
        setIsChecking(false);
      }
    };
    
    // Check for device ID
    const savedDeviceId = localStorage.getItem('device_id');
    if (savedDeviceId) {
      setDeviceId(savedDeviceId);
      
      // Get the saved device location, if any
      const savedLocation = localStorage.getItem('device_location');
      if (savedLocation) {
        setDeviceLocation(savedLocation);
      }
      
      // Get the saved device type, if any
      const savedType = localStorage.getItem('device_type');
      if (savedType) {
        setDeviceType(savedType);
      }
    } else {
      // Generate a new unique device ID
      const newDeviceId = crypto.randomUUID();
      localStorage.setItem('device_id', newDeviceId);
      setDeviceId(newDeviceId);
      
      // Set default location and type
      localStorage.setItem('device_location', deviceLocation);
      localStorage.setItem('device_type', deviceType);
    }
    
    checkOrganization();
  }, [navigate, toast, deviceLocation, deviceType]);

  // Redirect authenticated users based on role
  useEffect(() => {
    if (user && userRole) {
      let targetRoute = "/parent-dashboard";
      
      if (userRole === "admin") {
        targetRoute = "/admin-dashboard";
      } else if (userRole === "staff") {
        targetRoute = "/teacher-dashboard";
      }
      
      const returnPath = sessionStorage.getItem("returnPath");
      if (returnPath) {
        sessionStorage.removeItem("returnPath");
        navigate(returnPath);
      } else {
        navigate(targetRoute);
      }
    }
  }, [user, userRole, navigate]);

  const handleSignUp = () => {
    // Redirect to the full registration flow
    navigate("/parent-registration");
  };
  
  const handleStaffLogin = () => {
    navigate("/login", { state: { staffLogin: true } });
  };
  
  const handleBackToLanding = () => {
    navigate("/landing");
  };
  
  const handleUpdateDeviceSettings = () => {
    const location = prompt("Enter the location of this device:", deviceLocation);
    if (location && location.trim()) {
      setDeviceLocation(location.trim());
      localStorage.setItem('device_location', location.trim());
    }
    
    const type = prompt("Enter the type of this device (check-in or check-out):", deviceType);
    if (type && (type.trim() === 'check-in' || type.trim() === 'check-out')) {
      setDeviceType(type.trim());
      localStorage.setItem('device_type', type.trim());
    }
    
    toast({
      title: "Device Settings Updated",
      description: `This device is now set as: ${deviceType} at ${deviceLocation}`,
    });
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="absolute top-4 left-4 flex space-x-2">
        <Button 
          variant="ghost" 
          onClick={handleBackToLanding} 
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleStaffLogin}
          className="text-gray-500 hover:text-gray-700"
        >
          Staff Login
        </Button>
      </div>
      
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          onClick={handleUpdateDeviceSettings}
          className="text-gray-500 hover:text-gray-700"
        >
          <Settings className="mr-2 h-4 w-4" />
          Device Settings
        </Button>
      </div>
    
      <div className="w-full max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Welcome to {organizationName}</h1>
        <p className="text-gray-600 mb-1">Please enter your phone number to check in your children</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
          <span>Device ID: {deviceId && deviceId.substring(0, 8)}...</span>
          <span>•</span>
          <span>Location: {deviceLocation}</span>
          <span>•</span>
          <span>Type: {deviceType}</span>
        </div>
      </div>
      
      <LoginForm onSignUp={handleSignUp} />
      
      <div className="w-full max-w-2xl mt-6">
        <RegistrationPrompt onSignUp={handleSignUp} />
        
        <div className="mt-16">
          <AdminAccess />
        </div>
      </div>
    </div>
  );
};

export default CheckInKiosk;
