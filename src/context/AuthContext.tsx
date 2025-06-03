
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';

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

  const getUserRole = async (userId: string): Promise<AppRole | null> => {
    try {
      console.log("Fetching role for user:", userId);
      
      // Use a direct query to avoid RLS recursion issues
      const { data, error } = await supabase.rpc('get_current_user_role');

      if (error) {
        console.error("Error fetching user role:", error);
        // Fallback: try direct query with service role context
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
          
        if (fallbackError) {
          console.error("Fallback role fetch failed:", fallbackError);
          return 'parent'; // Default role
        }
        
        return fallbackData?.role as AppRole || 'parent';
      }

      console.log("User role fetched:", data);
      return data as AppRole || 'parent';
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
    
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log("Initializing auth...");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          console.log("Initial session found for user:", initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Get user role and setup status in parallel
          const [role, setupComplete] = await Promise.all([
            getUserRole(initialSession.user.id),
            checkSetupComplete()
          ]);
          
          if (!mounted) return;
          
          setUserRole(role);
          setIsSetupComplete(setupComplete);
        } else {
          console.log("No initial session found");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsSetupComplete(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsSetupComplete(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event, currentSession?.user?.id || "none");
        
        setIsLoading(true);
        
        try {
          // Set session and user immediately
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user && event !== 'TOKEN_REFRESHED') {
            console.log("Getting role for user after auth state change:", currentSession.user.id);
            
            // Get user role and setup status
            const [role, setupComplete] = await Promise.all([
              getUserRole(currentSession.user.id),
              checkSetupComplete()
            ]);
            
            if (mounted) {
              setUserRole(role);
              setIsSetupComplete(setupComplete);
            }
          } else if (!currentSession?.user) {
            setUserRole(null);
            setIsSetupComplete(null);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          if (mounted) {
            setUserRole(null);
            setIsSetupComplete(null);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsSetupComplete(null);
    } catch (error) {
      console.error("Error signing out:", error);
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
