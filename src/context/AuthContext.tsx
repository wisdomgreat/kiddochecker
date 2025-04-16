
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserRole, isSetupCompleted } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRole } from '@/types/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: AppRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSetupComplete: boolean | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  isInitialized: false,
  isSetupComplete: null,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserRole = async (userId: string) => {
    try {
      const role = await getUserRole();
      console.log("Fetched user role:", role);
      setUserRole(role);
      return role;
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
      return null;
    }
  };

  const checkSetupStatus = async () => {
    try {
      const setupCompleted = await isSetupCompleted();
      setIsSetupComplete(setupCompleted);
      return setupCompleted;
    } catch (error) {
      console.error("Error checking setup status:", error);
      return false;
    }
  };

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      console.log("Refreshed session:", data.session);
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        await fetchUserRole(data.session.user.id);
      }

      await checkSetupStatus();
      setIsLoading(false);
    } catch (error) {
      console.error("Error refreshing session:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state changed:", event, newSession?.user?.id);
            setSession(newSession);
            setUser(newSession?.user || null);

            // Handle session changed events
            if (newSession?.user) {
              const role = await fetchUserRole(newSession.user.id);
              console.log("User role from listener:", role);
              
              // Check if setup is complete
              const setupComplete = await checkSetupStatus();
              
              // Handle redirects based on events and roles
              if (event === "SIGNED_IN") {
                // Redirect based on role
                if (setupComplete) {
                  handleRoleBasedRedirect(role);
                } else if (role === 'admin') {
                  navigate("/organization-setup", { replace: true });
                }
                
                toast({
                  title: "Signed in successfully",
                  description: "Welcome back!",
                });
              }
            }
          }
        );

        // Then check for existing session
        const { data } = await supabase.auth.getSession();
        console.log("Initial auth session:", data.session);
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          const role = await fetchUserRole(data.session.user.id);
          console.log("User role from initial check:", role);
          const setupComplete = await checkSetupStatus();
          
          // If already signed in, redirect based on role
          if (role && isPublicRoute(location.pathname)) {
            if (setupComplete) {
              handleRoleBasedRedirect(role);
            } else if (role === 'admin') {
              navigate("/organization-setup", { replace: true });
            }
          }
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [navigate, toast, location.pathname]);

  const handleRoleBasedRedirect = (role: AppRole | null) => {
    if (!role) return;
    
    switch(role) {
      case "admin":
      case "super_admin":
        navigate("/admin-dashboard", { replace: true });
        break;
      case "teacher":
        navigate("/teacher-dashboard", { replace: true });
        break;
      case "staff":
        navigate("/teacher-dashboard", { replace: true });
        break;
      case "parent":
        navigate("/parent-dashboard", { replace: true });
        break;
      default:
        navigate("/landing", { replace: true });
    }
  };

  const isPublicRoute = (path: string) => {
    const publicRoutes = [
      "/landing", 
      "/login", 
      "/check-in-kiosk", 
      "/check-out-station", 
      "/parent-registration", 
      "/organization-setup", 
      "/unauthorized", 
      "/404"
    ];
    return publicRoutes.includes(path);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate("/landing", { replace: true });
      toast({
        title: "Signed out successfully",
        description: "You have been logged out",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userRole, 
      isLoading,
      isInitialized,
      isSetupComplete,
      signOut,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
