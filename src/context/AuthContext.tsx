
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

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
  isTeacherAssistant: boolean;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      return;
    }
    
    try {
      console.log('Fetching user role for:', user.id);
      
      const { data, error } = await supabase.rpc('get_current_user_role_secure');

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole('parent'); // Default fallback
        return;
      }

      const finalRole = data || 'parent';
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
        toast({
          title: "Sign Out Error",
          description: "There was an issue signing out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (error) {
      console.error("Exception during sign out:", error);
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const hasRole = useCallback((role: AppRole): boolean => {
    if (!userRole) return false;
    if (userRole === 'super_admin') return true; // Super admin has all roles
    return userRole === role;
  }, [userRole]);

  useEffect(() => {
    let mounted = true;

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
        
        // Defer role fetching to avoid blocking auth state change
        if (session?.user && mounted) {
          setTimeout(() => {
            if (mounted) {
              refreshUserRole().finally(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    // Get initial session
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
          setTimeout(() => {
            if (mounted) {
              refreshUserRole().finally(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setLoading(false);
        }
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

  // Role-based permissions
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isParent = userRole === 'parent';
  const isStaff = userRole === 'staff';
  const isTeacher = userRole === 'teacher';
  const isTeacherAssistant = userRole === 'teacher_assistant';

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
    isTeacherAssistant,
    hasRole,
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
