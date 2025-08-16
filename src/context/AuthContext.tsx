
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
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available for role refresh');
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
        // Check if this is a new user without role - assign default parent role
        if (error.code === 'PGRST116') {
          console.log('No role found, creating default parent role');
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
        setUserRole(null);
        return;
      }

      if (data) {
        console.log('User role data received:', data);
        const role = data.is_super_admin ? 'super_admin' : data.role;
        setUserRole(role as AppRole);
        console.log('Final assigned role:', role);
      } else {
        console.log('No role data returned');
        setUserRole(null);
      }
    } catch (error) {
      console.error("Exception refreshing user role:", error);
      setUserRole(null);
    }
  }, [user?.id]);

  const signOut = useCallback(async () => {
    try {
      console.log('Signing out user');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change event:', event, 'User ID:', session?.user?.id);
        
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
          // Small delay to ensure user is fully set before fetching role
          setTimeout(() => {
            if (mounted) {
              refreshUserRole();
            }
          }, 200);
        }
        
        setLoading(false);
      }
    );

    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Initial session found for user:', session.user.id);
          setSession(session);
          setUser(session.user);
          
          setTimeout(() => {
            if (mounted) {
              refreshUserRole();
            }
          }, 200);
        } else {
          console.log('No initial session found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Exception getting initial session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUserRole]);

  // Role-based permissions with proper checks
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isParent = userRole === 'parent';
  const isStaff = userRole === 'staff';
  const isTeacher = userRole === 'teacher' || userRole === 'teacher_assistant';

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
    isTeacher,
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
