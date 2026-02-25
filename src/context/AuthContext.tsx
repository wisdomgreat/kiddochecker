
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

// Utility function for exponential backoff retry
const fetchWithRetry = async <T,>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

export interface AuthContextType {
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
  verificationStatus: string | null;
  isVerifiedStaff: boolean;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Session backup to localStorage
  useEffect(() => {
    if (session && user) {
      localStorage.setItem('session_backup', JSON.stringify({
        userId: user.id,
        email: user.email,
        timestamp: Date.now()
      }));
    }
  }, [session, user]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
      toast({
        title: "Connection Restored",
        description: "You're back online.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
      toast({
        title: "Connection Lost",
        description: "You're offline. The app will reconnect when your connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      return;
    }

    // Check network status first
    if (!navigator.onLine) {
      console.log('Offline - skipping role fetch');
      const backup = localStorage.getItem('session_backup');
      if (backup) {
        try {
          const { userId } = JSON.parse(backup);
          if (userId === user.id) {
            setUserRole('parent'); // Default role for offline
            return;
          }
        } catch (e) {
          console.error('Failed to parse session backup:', e);
        }
      }
      return;
    }

    try {
      console.log('Fetching user role for:', user.id);

      // Use fetchWithRetry with increased timeout to 30s
      const { data, error } = await fetchWithRetry(
        async () => {
          const result = await Promise.race([
            supabase
              .from('user_roles')
              .select('role, is_super_admin, verification_status')
              .eq('user_id', user.id)
              .single(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Role fetch timeout')), 30000)
            )
          ]);
          return result as any;
        },
        3,
        1000
      );

      if (error) {
        console.error("Error fetching user role:", error);

        // If user doesn't exist in user_roles, create a default parent role
        if (error.code === 'PGRST116') {
          console.log('User not found in user_roles, creating default parent role');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'parent' as AppRole,
              is_super_admin: false
            });

          if (!insertError) {
            setUserRole('parent');
            console.log('Created default parent role for user');
          } else {
            console.error('Error creating default role:', insertError);
            setUserRole('parent'); // Fallback
          }
        } else {
          // For other errors, default to parent
          setUserRole('parent');
        }
        return;
      }

      const finalRole = (data?.is_super_admin ? 'super_admin' : data?.role) || 'parent';
      const finalStatus = data?.verification_status || 'unverified';
      setUserRole(finalRole as AppRole);
      setVerificationStatus(finalStatus);
      console.log('User role:', finalRole, 'Status:', finalStatus);
    } catch (error: any) {
      console.error("Exception refreshing user role:", error);

      // Provide specific error messages based on error type
      if (!navigator.onLine) {
        toast({
          title: "Connection Lost",
          description: "You're offline. The app will reconnect when your connection is restored.",
          variant: "destructive",
        });
      } else if (error.message?.includes('timeout')) {
        toast({
          title: "Slow Connection",
          description: "Taking longer than usual. Retrying automatically...",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Role Loading Issue",
          description: "Defaulted to parent access. Please refresh if this seems incorrect.",
          variant: "destructive",
        });
      }

      // Default to parent role to prevent infinite loading
      setUserRole('parent');
    }
  }, [user?.id, toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setVerificationStatus(null);

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
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const hasRole = useCallback((role: AppRole): boolean => {
    if (!userRole) return false;
    if (userRole === 'super_admin') return true;
    return userRole === role;
  }, [userRole]);

  useEffect(() => {
    let mounted = true;
    let roleTimeout: NodeJS.Timeout | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);

        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setVerificationStatus(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && mounted) {
          // Defer role fetch to prevent blocking
          setTimeout(() => {
            if (mounted) {
              refreshUserRole();
            }
          }, 0);
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Get initial session with timeout and retry
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await fetchWithRetry(
          async () => {
            const result = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session fetch timeout')), 30000)
              )
            ]);
            return result as any;
          },
          3,
          1000
        );

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

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Exception getting initial session:", error);
        if (mounted) {
          setLoading(false);
          // Show error message but don't crash
          toast({
            title: "Connection Issue",
            description: "Please refresh the page if you continue to see loading screens.",
            variant: "destructive",
          });
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      if (roleTimeout) clearTimeout(roleTimeout);
      subscription.unsubscribe();
    };
  }, [refreshUserRole, toast]);

  // Role-based permissions
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isParent = userRole === 'parent';
  const isStaff = userRole === 'staff';
  const isTeacher = userRole === 'teacher';
  const isTeacherAssistant = userRole === 'teacher_assistant';

  const isVerifiedStaff =
    (isStaff || isTeacher || isTeacherAssistant || isAdmin) &&
    verificationStatus === 'verified';

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
    verificationStatus,
    isVerifiedStaff,
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
