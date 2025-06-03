
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      console.log("User role fetched:", data?.role);
      return data?.role as AppRole || null;
    } catch (error) {
      console.error("Error in getUserRole:", error);
      return null;
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
    console.log("Initializing auth...");
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          console.log("Initial session found for user:", initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Get user role and setup status
          const [role, setupComplete] = await Promise.all([
            getUserRole(initialSession.user.id),
            checkSetupComplete()
          ]);
          
          setUserRole(role);
          setIsSetupComplete(setupComplete);
        } else {
          console.log("No initial session found");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id || "none");
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          console.log("Getting role for user after auth state change:", currentSession.user.id);
          
          // Get user role and setup status
          const [role, setupComplete] = await Promise.all([
            getUserRole(currentSession.user.id),
            checkSetupComplete()
          ]);
          
          setUserRole(role);
          setIsSetupComplete(setupComplete);
        } else {
          setUserRole(null);
          setIsSetupComplete(null);
        }
        
        setIsLoading(false);
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
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
