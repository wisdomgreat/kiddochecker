
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

  // Separate function to fetch user role
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

  // Separate function to check if setup is completed
  const checkSetupStatus = async () => {
    try {
      const setupCompleted = await isSetupCompleted();
      setIsSetupComplete(setupCompleted);
      return setupCompleted;
    } catch (error) {
      console.error("Error checking setup status:", error);
      return null;
    }
  };

  // Get the default redirect path based on user role
  const getDefaultRedirectPath = (role: AppRole | null): string => {
    if (!role) return '/landing';
    
    switch (role) {
      case 'admin':
      case 'super_admin':
        return '/admin-dashboard';
      case 'teacher':
      case 'teacher_assistant':
      case 'staff':
        return '/teacher-dashboard';
      case 'parent':
        return '/parent-dashboard';
      default:
        return '/landing';
    }
  };

  // Handle redirects based on authentication state and role
  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    console.log("Auth state changed:", event, newSession?.user?.id);
    
    // Update session and user state
    setSession(newSession);
    setUser(newSession?.user || null);
    
    if (newSession?.user) {
      // Fetch role and setup status
      const role = await fetchUserRole(newSession.user.id);
      const setupComplete = await checkSetupStatus();
      setIsLoading(false);
      
      if (event === "SIGNED_IN" && isPublicRoute(location.pathname)) {
        // Handle successful sign-in
        if (!setupComplete && role === 'admin') {
          navigate("/organization-setup", { replace: true });
        } else {
          const returnPath = sessionStorage.getItem("returnPath");
          const defaultPath = getDefaultRedirectPath(role);
          navigate(returnPath || defaultPath, { replace: true });
          sessionStorage.removeItem("returnPath"); // Clear return path after use
        }
        
        toast({
          title: "Signed in successfully",
          description: "Welcome back!"
        });
      }
    } else {
      setUserRole(null);
      setIsLoading(false);
      
      // If on protected route and not authenticated, redirect to landing
      if (event === "SIGNED_OUT" || (!newSession && !isPublicRoute(location.pathname))) {
        navigate("/landing", { replace: true });
      }
    }
  };

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchUserRole(data.session.user.id);
        await checkSetupStatus();
      } else {
        setSession(null);
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        
        // Get initial session
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          
          const role = await fetchUserRole(data.session.user.id);
          await checkSetupStatus();
          
          // Only redirect if on a public route and already authenticated
          if (isPublicRoute(location.pathname) && role) {
            const defaultPath = getDefaultRedirectPath(role);
            navigate(defaultPath, { replace: true });
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          
          // If on protected route and not authenticated, redirect to landing
          if (!isPublicRoute(location.pathname)) {
            navigate("/landing", { replace: true });
          }
        }
        
        setIsInitialized(true);
        setIsLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    initializeAuth();
  }, []); // Empty dependency array - only run on mount

  const isPublicRoute = (path: string): boolean => {
    const publicRoutes = [
      "/",
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
