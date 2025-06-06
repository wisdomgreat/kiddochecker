
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isLoading: boolean;
  isSetupComplete: boolean | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const { toast } = useToast();

  const getUserRole = async (userId: string): Promise<AppRole | null> => {
    try {
      console.log("Fetching role for user:", userId);
      
      // Use the security definer function to avoid RLS recursion
      const { data, error } = await supabase.rpc('get_current_user_role');

      if (error) {
        console.error("Error fetching user role:", error);
        return 'parent'; // Default role
      }

      console.log("User role fetched:", data);
      return (data as AppRole) || 'parent';
    } catch (error) {
      console.error("Error in getUserRole:", error);
      return 'parent'; // Default role
    }
  };

  const checkSetupComplete = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('id')
        .limit(1);

      if (error) {
        console.error("Error checking setup:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Error in checkSetupComplete:", error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST to prevent missing auth state changes during initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event, currentSession?.user?.id || "none");
        
        // Set session and user immediately
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Clear userRole when signing out
        if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setIsSetupComplete(null);
          return;
        }

        // For other auth events, fetch additional data needed
        if (currentSession?.user) {
          // We use setTimeout to avoid blocking the auth state change handler
          // and prevent potential deadlocks with Supabase auth
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const [role, setupComplete] = await Promise.all([
                getUserRole(currentSession.user.id),
                checkSetupComplete()
              ]);
              
              if (mounted) {
                setUserRole(role);
                setIsSetupComplete(setupComplete);
              }
            } catch (error) {
              console.error("Error handling auth state change:", error);
              if (mounted) {
                setUserRole('parent'); // Default role
                setIsSetupComplete(false);
                
                toast({
                  title: "Warning",
                  description: "Could not retrieve your user role. Some features may be limited.",
                  variant: "destructive"
                });
              }
            }
          }, 100);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          console.log("Initial session found for user:", initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Use setTimeout to defer additional queries and avoid deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const [role, setupComplete] = await Promise.all([
                getUserRole(initialSession.user.id),
                checkSetupComplete()
              ]);
              
              if (mounted) {
                setUserRole(role);
                setIsSetupComplete(setupComplete);
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
              if (mounted) {
                setUserRole('parent');
                setIsSetupComplete(false);
              }
            } finally {
              if (mounted) {
                setIsLoading(false);
              }
            }
          }, 100);
        } else {
          console.log("No initial session found");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsSetupComplete(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsSetupComplete(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsSetupComplete(null);
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
      
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    userRole,
    isLoading,
    isSetupComplete,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
