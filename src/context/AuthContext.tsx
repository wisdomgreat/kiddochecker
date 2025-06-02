
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';

interface AuthContextProps {
  user: User | null;
  userRole: AppRole | null;
  isLoading: boolean;
  isSetupComplete: boolean | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  userRole: null,
  isLoading: true,
  isSetupComplete: null,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  
  // Function to get user role with better error handling
  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      console.log("Fetching role for user:", userId);
      
      // Use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_user_role');
      
      if (!rpcError && rpcData) {
        console.log("Got role from RPC:", rpcData);
        return rpcData as AppRole;
      }
      
      console.log("RPC failed, using fallback:", rpcError);
      return 'parent'; // Default role
      
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return 'parent'; // Default role on error
    }
  };

  // Function to check setup completion
  const checkSetupCompletion = async (): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('organization_settings')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error("Error checking setup status:", error);
        return false;
      }
      
      return count ? count > 0 : false;
    } catch (error) {
      console.error("Error in checkSetupCompletion:", error);
      return false;
    }
  };

  // Function to refresh the session and user data
  const refreshSession = async () => {
    try {
      console.log("Refreshing session...");
      
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;
      
      console.log("Current session:", currentSession ? "exists" : "null");
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const role = await fetchUserRole(currentSession.user.id);
        setUserRole(role);
        
        const setupCompleted = await checkSetupCompletion();
        setIsSetupComplete(setupCompleted);
      } else {
        setUserRole(null);
        setIsSetupComplete(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      setUserRole('parent');
    }
  };

  // Handle sign out
  const signOut = async () => {
    try {
      console.log("Signing out...");
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsSetupComplete(null);
      sessionStorage.removeItem("returnPath");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    console.log("Initializing auth...");
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "session exists" : "no session");
        
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user && event !== 'SIGNED_OUT') {
          console.log("Getting role for user after auth state change:", newSession.user.id);
          try {
            const role = await fetchUserRole(newSession.user.id);
            if (mounted) {
              setUserRole(role);
              
              const setupCompleted = await checkSetupCompletion();
              setIsSetupComplete(setupCompleted);
            }
          } catch (error) {
            console.error("Error setting user role:", error);
            if (mounted) setUserRole('parent');
          }
        } else {
          console.log("No session or signed out");
          if (mounted) {
            setUserRole(null);
            setIsSetupComplete(null);
          }
        }
        
        if (mounted) setIsLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log("Initial session check:", initialSession ? "session exists" : "no session");
        
        if (initialSession?.user && mounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          console.log("Getting initial role for user:", initialSession.user.id);
          const role = await fetchUserRole(initialSession.user.id);
          if (mounted) {
            setUserRole(role);
            
            const setupCompleted = await checkSetupCompletion();
            setIsSetupComplete(setupCompleted);
          }
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isLoading,
        isSetupComplete,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
