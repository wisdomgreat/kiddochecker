
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { UserRoleService } from '@/services/userRoleService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const roleLoading = useRef(false);

  const refreshUserRole = useCallback(async () => {
    if (!user || roleLoading.current || !mounted.current) return;
    
    roleLoading.current = true;
    try {
      console.log("Refreshing role for user:", user.id);
      const role = await UserRoleService.getCurrentUserRole();
      
      if (mounted.current) {
        console.log("User role refreshed:", role);
        setUserRole(role || 'parent'); // Default to parent if no role found
      }
    } catch (error) {
      console.error("Error refreshing user role:", error);
      if (mounted.current) {
        setUserRole('parent'); // Default to parent on error
      }
    } finally {
      roleLoading.current = false;
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
      // Clear state immediately for security
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } catch (error) {
      console.error("Exception during sign out:", error);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        
        console.log("Auth state changed:", event, session?.user?.id);
        
        // Handle sign out immediately for security
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch role for new sessions (but not for token refresh)
        if (session?.user && event !== 'TOKEN_REFRESHED') {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            if (mounted.current) {
              refreshUserRole();
            }
          }, 0);
        }
        
        if (event === 'SIGNED_IN') {
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted.current) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Initial session found for user:", session.user.id);
          setSession(session);
          setUser(session.user);
          
          // Fetch role but don't block loading state
          setTimeout(() => {
            if (mounted.current) {
              refreshUserRole();
            }
          }, 0);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Exception getting initial session:", error);
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [refreshUserRole]);

  const value = {
    user,
    session,
    userRole,
    loading,
    signOut,
    refreshUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
