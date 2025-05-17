
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
        const role = await getUserRole();
        console.log("User role from refreshSession:", role);
        setUserRole(role);
        
        // Check if setup is completed
        const setupCompleted = await isSetupCompleted();
        console.log("Setup completed:", setupCompleted);
        setIsSetupComplete(setupCompleted);
      } else {
        setUserRole(null);
        setIsSetupComplete(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
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
    
    // Set up auth state listener FIRST 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "session exists" : "no session");
        
        // Update session and user immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // If we have a user, get their role
        if (newSession?.user) {
          try {
            // Allow the state update above to complete before getting additional data
            // This prevents potential React state update conflicts
            setTimeout(async () => {
              const role = await getUserRole();
              console.log(`User role updated from auth state change: ${role}`);
              setUserRole(role);
              
              const setupCompleted = await isSetupCompleted();
              console.log("Setup completed:", setupCompleted);
              setIsSetupComplete(setupCompleted);
              
              setIsLoading(false);
            }, 0);
          } catch (error) {
            console.error("Error getting user role:", error);
            setIsLoading(false);
          }
        } else {
          console.log("No session in auth change event");
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
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          try {
            const role = await getUserRole();
            console.log("Initial user role:", role);
            setUserRole(role);
            
            const setupCompleted = await isSetupCompleted();
            console.log("Setup completed:", setupCompleted);
            setIsSetupComplete(setupCompleted);
          } catch (error) {
            console.error("Error in initializeAuth:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          // Set loading to false if no initial session
          console.log("No initial session found, setting loading to false");
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
