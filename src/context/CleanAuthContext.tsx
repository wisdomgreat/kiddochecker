
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      return;
    }
    
    try {
      console.log('Fetching user role for:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        if (error.code === 'PGRST116') {
          // No role found, create default parent role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'parent'
            });
          
          if (!insertError) {
            setUserRole('parent');
            return;
          }
        }
        setUserRole('parent'); // Default fallback
        return;
      }

      const finalRole = data.is_super_admin ? 'super_admin' : data.role;
      setUserRole(finalRole as AppRole);
      console.log('User role set to:', finalRole);
    } catch (error) {
      console.error("Exception refreshing user role:", error);
      setUserRole('parent'); // Default fallback
    }
  }, [user?.id]);

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
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          await refreshUserRole();
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Exception getting initial session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
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
        
        if (session?.user && mounted) {
          await refreshUserRole();
        }
        
        setLoading(false);
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUserRole]);

  // Clean role-based permissions
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isParent = userRole === 'parent';
  const isStaff = userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant';

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
    isStaff,
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
