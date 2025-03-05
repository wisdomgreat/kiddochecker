
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoginForm from "@/components/check-in/LoginForm";
import RegistrationPrompt from "@/components/check-in/RegistrationPrompt";
import AdminAccess from "@/components/check-in/AdminAccess";

const CheckInKiosk = () => {
  const [session, setSession] = useState(null);
  const [organizationName, setOrganizationName] = useState("Your Church");
  const [hasOrganization, setHasOrganization] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
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
    
    checkOrganization();
  }, [navigate, toast]);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session) {
        // If already logged in, redirect to dashboard
        navigate("/parent-dashboard");
      }
    };
    
    if (hasOrganization) {
      checkSession();
      
      // Subscribe to auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          setSession(newSession);
          if (newSession) {
            navigate("/parent-dashboard");
          }
        }
      );
      
      return () => {
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    }
  }, [navigate, hasOrganization]);

  const handleSignUp = () => {
    // Redirect to the full registration flow
    navigate("/parent-registration");
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
      <div className="w-full max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Welcome to {organizationName}</h1>
        <p className="text-gray-600">Please enter your phone number to check in your children</p>
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
