
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

  // Fetch user role without causing infinite loop
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId);
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

  // Check if setup is completed
  const checkSetupStatus = async () => {
    try {
      const setupCompleted = await isSetupCompleted();
      console.log("Setup completed:", setupCompleted);
      setIsSetupComplete(setupCompleted);
      return setupCompleted;
    } catch (error) {
      console.error("Error checking setup status:", error);
      return null;
    }
  };

  // Get the default redirect path based on user role
  const getDefaultRedirectPath = (role: AppRole | null, setupComplete: boolean | null): string => {
    if (!role) return '/landing';
    
    // If setup is not completed and user is admin, redirect to setup
    if (setupComplete === false && (role === 'admin' || role === 'super_admin')) {
      return '/organization-setup';
    }
    
    switch(role) {
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
      const setupCompleted = await checkSetupStatus();
      
      if (event === "SIGNED_IN") {
        console.log("Signed in with role:", role, "Setup completed:", setupCompleted);
        
        if (isPublicRoute(location.pathname)) {
          const returnPath = sessionStorage.getItem("returnPath");
          const defaultPath = getDefaultRedirectPath(role, setupCompleted);
          console.log("Redirecting after login to:", returnPath || defaultPath);
          
          navigate(returnPath || defaultPath, { replace: true });
          sessionStorage.removeItem("returnPath");
          
          toast({
            title: "Signed in successfully",
            description: `Welcome back! Logged in as ${role || 'user'}`
          });
        }
      }
    } else {
      setUserRole(null);
      
      if (event === "SIGNED_OUT" && !isPublicRoute(location.pathname)) {
        navigate("/landing", { replace: true });
      }
    }
    
    // Always set loading to false after handling auth state
    setIsLoading(false);
  };

  const refreshSession = async () => {
    try {
      console.log("Refreshing session...");
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchUserRole(data.session.user.id);
        await checkSetupStatus();
        console.log("Session refreshed successfully");
      } else {
        console.log("No active session found during refresh");
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

  const isPublicRoute = (path: string): boolean => {
    const publicRoutes = [
      "/", "/index.html",
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

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("Initializing auth...");
      setIsLoading(true);
      
      try {
        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            // Use setTimeout to prevent any potential recursion or race conditions
            setTimeout(() => {
              handleAuthStateChange(event, session);
            }, 0);
          }
        );
        
        // Get initial session
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log("Initial session found for user:", data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          
          const role = await fetchUserRole(data.session.user.id);
          const setupCompleted = await checkSetupStatus();
          
          // Only redirect if on a public route and already authenticated
          if (isPublicRoute(location.pathname) && role) {
            const defaultPath = getDefaultRedirectPath(role, setupCompleted);
            console.log("Initial redirect to:", defaultPath);
            navigate(defaultPath, { replace: true });
          }
          
          setIsLoading(false);
        } else {
          console.log("No initial session found");
          setSession(null);
          setUser(null);
          setUserRole(null);
          
          // If on protected route and not authenticated, redirect to landing
          if (!isPublicRoute(location.pathname)) {
            navigate("/landing", { replace: true });
          }
          
          setIsLoading(false);
        }
        
        setIsInitialized(true);
        
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
  }, []); // Remove dependencies to prevent re-initialization
  
  // Handle location changes to protect routes
  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user && !isPublicRoute(location.pathname)) {
        console.log("Redirecting unauthenticated user from protected route to landing");
        navigate("/landing", { replace: true });
      }
    }
  }, [location.pathname, isInitialized, isLoading, user]);

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
