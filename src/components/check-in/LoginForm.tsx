
import React, { useState, useEffect } from "react";
import { HelpCircle, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneNumberForm from "./PhoneNumberForm";
import PinEntryForm from "./PinEntryForm";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

interface LoginFormProps {
  onSignUp: () => void;
}

export const LoginForm = ({ onSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading: authLoading } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();

  useEffect(() => {
    if (user && userRole && !authLoading && !loading) {
      const currentPath = location.pathname;
      const isDashboardPath = currentPath.includes('dashboard') || currentPath === '/';
      
      if (!isDashboardPath || currentPath === '/login') {
        navigateToDashboard();
      }
    }
  }, [user, userRole, authLoading, loading, location.pathname, navigateToDashboard]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Authentication failed");
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "Too many login attempts. Please wait a moment before trying again.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-slate-50/90 border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 rounded-full p-2">
            <User className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-semibold">Sign In</h2>
            <p className="text-sm text-gray-500">Enter your credentials to continue</p>
          </div>
        </div>
        
        <div className="space-y-6 mt-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-700"
            disabled={!email || !password || loading}
          >
            {loading ? "Signing in..." : (
              <div className="flex items-center justify-center">
                Sign In <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            )}
          </Button>
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={onSignUp}
              className="text-blue-600 hover:text-blue-800"
              disabled={loading}
            >
              Don't have an account? Sign up here
            </Button>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-500 flex items-center justify-center gap-1">
            <HelpCircle className="h-4 w-4" />
            Need help? Ask a staff member for assistance
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;


