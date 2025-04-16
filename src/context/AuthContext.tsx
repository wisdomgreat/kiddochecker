
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
    } finally {
      // Always set loading to false after role fetch completes (success or error)
      setIsLoading(false);
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
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        await fetchUserRole(data.session.user.id);
      } else {
        setUserRole(null);
        setIsLoading(false);
      }

      await checkSetupStatus();
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
          (event, newSession) => {
            console.log("Auth state changed:", event, newSession?.user?.id);
            
            // Update session and user state immediately
            setSession(newSession);
            setUser(newSession?.user || null);

            // Handle session changed events
            if (newSession?.user) {
              // Defer role fetching to avoid blocking UI
              setTimeout(async () => {
                const role = await fetchUserRole(newSession.user.id);
                const setupComplete = await checkSetupStatus();
                
                // Handle redirects based on events and roles
                if (event === "SIGNED_IN") {
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
              }, 0);
            } else {
              setUserRole(null);
              setIsLoading(false);
            }
          }
        );

        // Then check for existing session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          const role = await fetchUserRole(data.session.user.id);
          const setupComplete = await checkSetupStatus();
          
          if (role && isPublicRoute(location.pathname)) {
            if (setupComplete) {
              handleRoleBasedRedirect(role);
            } else if (role === 'admin') {
              navigate("/organization-setup", { replace: true });
            }
          }
        } else {
          setIsLoading(false);
        }

        setIsInitialized(true);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth session:', error);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [navigate, toast, location.pathname]);

  const handleRoleBasedRedirect = (role: AppRole | null) => {
    if (!role) return;
    
    // Get return path from session storage if available
    const returnPath = sessionStorage.getItem("returnPath");
    
    let targetRoute = "/parent-dashboard";
    switch(role) {
      case "admin":
      case "super_admin":
        targetRoute = "/admin-dashboard";
        break;
      case "teacher":
      case "teacher_assistant":
      case "staff":
        targetRoute = "/teacher-dashboard";
        break;
      default:
        targetRoute = "/parent-dashboard";
    }
    
    navigate(returnPath || targetRoute, { replace: true });
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
    return publicRoutes.includes(path) || path === "/";
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserRole(null);
      setIsLoading(false);
      navigate("/landing", { replace: true });
      toast({
        title: "Signed out successfully",
        description: "You have been logged out",
      });
    } catch (error: any) {
      setIsLoading(false);
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
