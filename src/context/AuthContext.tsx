
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
  isVolunteer: boolean;
  isKiosk: boolean;
  verificationStatus: string | null;
  isVerifiedStaff: boolean;
  hasRole: (role: AppRole) => boolean;
  hasPermission: (permissionName: string) => boolean;
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

  // Session backup to localStorage — stores only non-PII (userId, not email)
  useEffect(() => {
    if (session && user) {
      localStorage.setItem('session_backup', JSON.stringify({
        userId: user.id,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('session_backup');
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

    try {
      console.log('Fetching user role for:', user.id, 'at', window.location.href);

      // We add a tiny delay to ensure Auth state is fully established on the backend before querying RLS
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role (Supabase):", error);
        toast({
          title: "Role Connection Error",
          description: `Error: ${error.message} (Code: ${error.code}). Please refresh your page.`,
          variant: "destructive",
        });
        // We do NOT set offline fallback here anymore, just let it fail so they see the issue
        setUserRole('parent');
        return;
      }

      if (!data) {
        console.warn('No role found in DB for user record:', user.id);
        toast({
          title: "Role Missing",
          description: "Your account is missing role permissions in our database. Contact support.",
          variant: "destructive",
        });
        setUserRole('parent');
        return;
      }

      console.log('Raw DB Role data received:', data);
      
      const roleData = data as any;
      let finalRole = roleData.role || 'parent';
      
      // Explicitly override if super_admin string or boolean is found
      if (roleData.is_super_admin === true || roleData.role === 'super_admin') {
         finalRole = 'super_admin';
      }
      
      const finalStatus = roleData.verification_status || 'unverified';
      
      console.log('Final Determined Role:', finalRole);
      
      setUserRole(finalRole as AppRole);
      setVerificationStatus(finalStatus);
    } catch (err: any) {
      console.error("Exception in refreshUserRole:", err);
      toast({
          title: "Critical Fetch Error",
          description: err.message || "Unknown error occurred.",
          variant: "destructive",
      });
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setVerificationStatus(null);
          localStorage.removeItem('session_backup');
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
  const isVolunteer = userRole === 'volunteer';
  const isKiosk = userRole === 'kiosk';

  const isVerifiedStaff =
    (isStaff || isTeacher || isTeacherAssistant || isAdmin) &&
    verificationStatus === 'verified';

  // Granular permission check
  const hasPermission = useCallback((permissionName: string): boolean => {
    if (isSuperAdmin) return true;
    
    // Basic mapping for now until we fetch full permission set
    const permissionMap: Record<string, string[]> = {
      'access_kiosk': ['admin', 'super_admin', 'staff', 'teacher', 'kiosk'],
      'manage_users': ['admin', 'super_admin'],
      'view_audit_logs': ['admin', 'super_admin'],
    };

    if (permissionMap[permissionName]) {
      return permissionMap[permissionName].includes(userRole || '');
    }
    
    return false;
  }, [isSuperAdmin, userRole]);

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
    isVolunteer,
    isKiosk,
    verificationStatus,
    isVerifiedStaff,
    hasRole,
    hasPermission,
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
