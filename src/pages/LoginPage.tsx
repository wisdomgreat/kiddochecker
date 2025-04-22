
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, LogIn, UserPlus, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { user, userRole, isLoading: authLoading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isStaffLogin = location.state?.staffLogin || false;
  
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Redirect if already logged in
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (!user && !authLoading && !isLoading) {
        return; // Not logged in, stay on login page
      }
      
      if (user && !authLoading && !isLoading) {
        console.log("LoginPage: Already logged in, refreshing session to get role");
        await refreshSession(); // Ensure we have the latest role
      }
      
      if (user && userRole && !authLoading && !isLoading) {
        console.log("LoginPage: Already logged in as:", userRole);
        const returnPath = sessionStorage.getItem("returnPath");
        let targetRoute = "/parent-dashboard";
        
        if (userRole === "admin" || userRole === "super_admin") {
          targetRoute = "/admin-dashboard";
        } else if (userRole === "teacher" || userRole === "staff" || userRole === "teacher_assistant") {
          targetRoute = "/teacher-dashboard";
        }
        
        console.log("LoginPage: Redirecting to:", returnPath || targetRoute);
        navigate(returnPath || targetRoute, { replace: true });
        sessionStorage.removeItem("returnPath");
      }
    };
    
    checkAuthAndRedirect();
  }, [user, userRole, authLoading, isLoading, navigate, refreshSession]);
  
  const onSubmit = async (values: LoginValues) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "You are now logged in",
      });
      
      // Manually refresh the session to ensure we have the latest role
      await refreshSession();
      
      // Auth context will handle redirection
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLanding = () => {
    navigate("/landing");
  };
  
  const handleParentRegistration = () => {
    navigate("/parent-registration");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          onClick={handleBackToLanding} 
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            {isStaffLogin ? "Staff Login" : "Log In to Your Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isStaffLogin 
              ? "Log in with your staff credentials" 
              : "Welcome back! Please enter your details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email" 
                        type="email" 
                        {...field} 
                        disabled={isLoading || authLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your password" 
                        type="password" 
                        {...field} 
                        disabled={isLoading || authLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        {!isStaffLogin && (
          <CardFooter className="flex justify-center border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Don't have an account?
              </p>
              <Button 
                variant="outline" 
                onClick={handleParentRegistration}
                className="w-full"
                disabled={isLoading || authLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register as a Parent
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
