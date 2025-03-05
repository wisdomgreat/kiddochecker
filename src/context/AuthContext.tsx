
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserRole } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
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

  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        await fetchUserRole(data.session.user.id);
      }
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
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          await fetchUserRole(data.session.user.id);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user || null);

        // Handle session changed events
        if (newSession?.user) {
          const role = await fetchUserRole(newSession.user.id);
          
          // Handle redirects based on events and roles
          if (event === "SIGNED_IN") {
            const returnPath = sessionStorage.getItem("returnPath") || "/";
            sessionStorage.removeItem("returnPath");
            
            // Redirect based on role
            if (role === "admin") {
              navigate("/admin-dashboard");
            } else if (role === "staff") {
              navigate("/teacher-dashboard");
            } else if (role === "parent") {
              navigate("/parent-dashboard");
            } else {
              navigate(returnPath !== location.pathname ? returnPath : "/");
            }
            
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
          }
        } else if (event === "SIGNED_OUT") {
          setUserRole(null);
          
          // If on a protected route, redirect to login
          const publicRoutes = ["/landing", "/check-in-kiosk", "/parent-registration", "/organization-setup", "/unauthorized", "/404"];
          if (!publicRoutes.includes(location.pathname)) {
            navigate("/check-in-kiosk");
          }
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
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/check-in-kiosk");
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
      signOut,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
