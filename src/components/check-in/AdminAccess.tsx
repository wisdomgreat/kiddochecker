import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, User, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

export const AdminAccess = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Attempt to sign in with provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      // Use type assertion to handle our updated enum values
      const userRole = roleData?.role as AppRole;
      
      if (userRole === 'admin') {
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the admin dashboard",
        });
        navigate("/admin-dashboard");
      } else if (userRole === 'teacher') {
        toast({
          title: "Teacher Login Successful",
          description: "Welcome to the teacher dashboard",
        });
        navigate("/teacher-dashboard");
      } else {
        // If the user doesn't have an admin or teacher role
        toast({
          title: "Access Denied",
          description: "You don't have teacher or administrator privileges",
          variant: "destructive",
        });
        // Sign out the user since they don't have the right role
        await supabase.auth.signOut();
      }
      
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!showLoginForm) {
    return (
      <div className="text-center mt-8 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500 mb-2">Staff and Administrator Access</p>
        <Button 
          variant="outline" 
          className="bg-white text-gray-700 border-gray-300" 
          onClick={() => setShowLoginForm(true)}
        >
          <Shield className="mr-2 h-4 w-4 text-purple-500" />
          Staff Login
        </Button>
      </div>
    );
  }
  
  return (
    <div className="text-center mt-8 border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-500 mb-2">Staff and Administrator Access</p>
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="font-semibold">Staff Login</h3>
          </div>
          
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="staff-password">Password</Label>
              <div className="relative">
                <Input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLoginForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccess;
