
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoginForm from "@/components/check-in/LoginForm";
import RegistrationPrompt from "@/components/check-in/RegistrationPrompt";
import AdminAccess from "@/components/check-in/AdminAccess";

const CheckInKiosk = () => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

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
  }, [navigate]);

  const handleSignUp = () => {
    // Redirect to the full registration flow
    navigate("/parent-registration");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Welcome to ChurchCheck</h1>
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
