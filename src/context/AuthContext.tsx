
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserRole, isSetupCompleted } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserRole = async (userId: string) => {
    try {
      const role = await getUserRole();
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
      const { data } = await supabase.auth.getSession();
      console.log("Refreshed session:", data.session);
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        await fetchUserRole(data.session.user.id);
      }

      await checkSetupStatus();
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        console.log("Initial auth session:", data.session);
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          await fetchUserRole(data.session.user.id);
        }

        await checkSetupStatus();
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user || null);

        // Handle session changed events
        if (newSession?.user) {
          const role = await fetchUserRole(newSession.user.id);
          console.log("User role:", role);
          
          // Check if setup is complete
          const setupComplete = await checkSetupStatus();
          
          // Handle redirects based on events and roles
          if (event === "SIGNED_IN") {
            // Save current path for potential return after login
            const currentPath = location.pathname;
            const publicRoutes = ["/check-in-kiosk", "/landing", "/login", "/check-out-station", "/parent-registration", "/organization-setup"];
            const isPublicRoute = publicRoutes.includes(currentPath);
            
            // If setup is not complete, redirect to organization setup
            if (!setupComplete && role === 'admin' && !currentPath.includes('organization-setup')) {
              navigate("/organization-setup");
              return;
            }
            
            // Redirect based on role if on a public route
            if (isPublicRoute && setupComplete) {
              if (role === "admin") {
                navigate("/admin-dashboard");
              } else if (role === "staff") {
                navigate("/teacher-dashboard");
              } else if (role === "parent") {
                navigate("/parent-dashboard");
              }
            }
            
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
          }
        } else if (event === "SIGNED_OUT") {
          setUserRole(null);
          
          // If on a protected route, redirect to landing page
          const publicRoutes = ["/landing", "/check-in-kiosk", "/login", "/check-out-station", "/parent-registration", "/organization-setup", "/unauthorized", "/404"];
          if (!publicRoutes.includes(location.pathname)) {
            navigate("/landing");
          }
          
          toast({
            title: "Signed out",
            description: "You have been logged out",
          });
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, toast, location.pathname]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/landing");
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
