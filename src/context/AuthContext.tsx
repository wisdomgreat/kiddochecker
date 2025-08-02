
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
        
        // For organization creators, they should get super_admin role, not parent
        const isOrgCreator = user.user_metadata?.is_org_creator;
        
        if (error.code === 'PGRST116' && !isOrgCreator) {
          console.log('No role found for regular user, creating default parent role');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'parent' as AppRole
            });
          
          if (!insertError && mounted.current) {
            setUserRole('parent');
          }
        } else if (isOrgCreator) {
          console.log('Organization creator detected, should have admin role...');
          // For org creators, wait a bit longer for role assignment
          setTimeout(() => {
            if (mounted.current) {
              refreshUserRole();
            }
          }, 2000);
        } else if (mounted.current) {
          setUserRole('parent'); // fallback
        }
        return;
      }

      if (mounted.current && data) {
        const role = data.is_super_admin ? 'super_admin' : data.role;
        console.log('User role set to:', role);
        setUserRole(role);
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
          // Quick role fetch for immediate redirection
          setTimeout(() => {
            if (mounted.current) {
              refreshUserRole();
            }
          }, 100); // Reduced delay for faster redirection
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
