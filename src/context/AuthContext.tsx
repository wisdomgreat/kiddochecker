
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
  refreshUserRole: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refreshUserRole = useCallback(async () => {
    if (!user || !mounted.current) return;
    
    try {
      console.log('Fetching user role for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        if (mounted.current) {
          setUserRole('parent'); // Default fallback
        }
        return;
      }

      if (mounted.current && data) {
        console.log('User role data:', data);
        setUserRole(data.role as AppRole);
      }
    } catch (error) {
      console.error("Exception refreshing user role:", error);
      if (mounted.current) {
        setUserRole('parent');
      }
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            if (mounted.current) {
              refreshUserRole();
            }
          }, 100);
        }
        
        setLoading(false);
      }
    );

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
          setSession(session);
          setUser(session.user);
          
          setTimeout(() => {
            if (mounted.current) {
              refreshUserRole();
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

    getInitialSession();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [refreshUserRole]);

  // Clear role-based permissions
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isParent = userRole === 'parent';

  const value = {
    user,
    session,
    userRole,
    loading,
    signOut,
    refreshUserRole,
    isAdmin,
    isSuperAdmin,
    isParent,
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
