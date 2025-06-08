
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const roleLoading = useRef(false);

  const fetchUserRole = useCallback(async (userId: string) => {
    if (roleLoading.current || !mounted.current) return;
    
    roleLoading.current = true;
    try {
      console.log("Fetching role for user:", userId);
      
      const { data, error } = await supabase.rpc('get_current_user_role');

      if (!mounted.current) return;

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole('parent');
        return;
      }

      console.log("User role fetched:", data);
      setUserRole((data as AppRole) || 'parent');
    } catch (error) {
      console.error("Exception fetching user role:", error);
      if (mounted.current) {
        setUserRole('parent');
      }
    } finally {
      roleLoading.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      if (mounted.current) {
        setUser(null);
        setSession(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted.current) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session) {
          console.log("Initial session found for user:", session.user.id);
          setSession(session);
          setUser(session.user);
          
          // Defer role fetching to avoid blocking
          setTimeout(() => {
            if (mounted.current) {
              fetchUserRole(session.user.id);
            }
          }, 100);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Exception getting initial session:", error);
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        
        console.log("Auth state changed:", event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event !== 'TOKEN_REFRESHED') {
          // Defer role fetching to avoid blocking the auth flow
          setTimeout(() => {
            if (mounted.current) {
              fetchUserRole(session.user.id);
            }
          }, 100);
        } else if (!session) {
          setUserRole(null);
        }
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    getInitialSession();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const value = {
    user,
    session,
    userRole,
    loading,
    signOut,
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
