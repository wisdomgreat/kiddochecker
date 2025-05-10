
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserRole, isSetupCompleted } from '@/integrations/supabase/client';
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
  
  // Function to refresh the session and user data
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      console.log("Refreshing session...");
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;
      
      console.log("Current session:", currentSession ? "exists" : "null");
      
      // Update state with session data
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // If we have a user, get their role
      if (currentSession?.user) {
        console.log("Getting role for user:", currentSession.user.id);
        // Add slight delay to avoid potential race conditions with auth state
        setTimeout(async () => {
          const role = await getUserRole();
          console.log("User role:", role);
          setUserRole(role);
          
          // Check if setup is completed
          const setupCompleted = await isSetupCompleted();
          console.log("Setup completed:", setupCompleted);
          setIsSetupComplete(setupCompleted);
          setIsLoading(false);
        }, 100);
      } else {
        setUserRole(null);
        setIsSetupComplete(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      setIsLoading(false);
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
      
      // Clear any stored paths
      sessionStorage.removeItem("returnPath");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    console.log("Initializing auth...");
    setIsLoading(true);
    
    // Set up auth state listener FIRST (this is critical to avoid auth deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "session exists" : "no session");
        
        // Update session and user immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // If we have a user, get their role
        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(async () => {
            try {
              const role = await getUserRole();
              console.log("User role updated:", role);
              setUserRole(role);
              
              const setupCompleted = await isSetupCompleted();
              console.log("Setup completed:", setupCompleted);
              setIsSetupComplete(setupCompleted);
              setIsLoading(false);
            } catch (error) {
              console.error("Error getting user role:", error);
              setIsLoading(false);
            }
          }, 100);
        } else {
          setUserRole(null);
          setIsSetupComplete(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log("Initial session check:", initialSession ? "session exists" : "no session");
        
        // Don't set session/user here as it will be handled by onAuthStateChange
        
        // Only initialize additional data if not already done by authStateChange
        if (initialSession?.user && !userRole) {
          setTimeout(async () => {
            try {
              const role = await getUserRole();
              console.log("Initial user role:", role);
              setUserRole(role);
              
              const setupCompleted = await isSetupCompleted();
              console.log("Setup completed:", setupCompleted);
              setIsSetupComplete(setupCompleted);
              setIsLoading(false);
            } catch (error) {
              console.error("Error in initializeAuth:", error);
              setIsLoading(false);
            }
          }, 100);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
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
