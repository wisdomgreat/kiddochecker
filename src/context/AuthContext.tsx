
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
  mfaLevel: 'aal1' | 'aal2';
  isMfaPending: boolean;
  isMfaEnrolled: boolean;
  mfaFactors: any[];
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  refreshMfaStatus: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isParent: boolean;
  isStaff: boolean;
  isTeacher: boolean;
  isTeacherAssistant: boolean;
  isVolunteer: boolean;
  isKiosk: boolean;
  isRegularUser: boolean;
  verificationStatus: string | null;
  isVerifiedStaff: boolean;
  hasRole: (role: AppRole) => boolean;
  hasPermission: (permissionName: string) => boolean;
  userPermissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [mfaLevel, setMfaLevel] = useState<'aal1' | 'aal2'>('aal1');
  const [isMfaPending, setIsMfaPending] = useState(false);
  const [isMfaEnrolled, setIsMfaEnrolled] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize role from cache if available for instant UI
  useEffect(() => {
    const backup = localStorage.getItem('session_backup');
    if (backup) {
      try {
        const { userId } = JSON.parse(backup);
        const cachedRole = localStorage.getItem(`auth_role_${userId}`);
        if (cachedRole) {
          const { role, permissions, status } = JSON.parse(cachedRole);
          setUserRole(role);
          setUserPermissions(permissions || []);
          setVerificationStatus(status);
          console.log('Restored cached role:', role);
        }
      } catch (e) {
        console.warn('Failed to restore cached role', e);
      }
    }
  }, []);
  const { toast } = useToast();

  const refreshMfaStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!error && data) {
        setMfaLevel(data.currentLevel as any || 'aal1');
        setIsMfaPending(data.nextLevel === 'aal2' && data.currentLevel !== 'aal2');
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (!factorsError && factors) {
         setMfaFactors(factors.all || []);
         setIsMfaEnrolled(factors.all.length > 0);
      }
    } catch (e) {
      console.warn("MFA level fetching failed", e);
    }
  }, []);

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
      setLoading(false);
      return;
    }

    console.log('Refreshing user role for:', user.id);
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Role fetching timed out after 10s');
      setLoading(false);
    }, 10000);

    try {
      // Remove arbitrary delay for faster loading

      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          custom_roles (
            role_permissions (
              permissions (name)
            )
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role (Supabase):", error);
        toast({
          title: "Role Connection Error",
          description: `Error: ${error.message}. Please refresh your page.`,
          variant: "destructive",
        });
        setUserRole(null);
        return;
      }

      if (!data) {
        console.warn('No role found in DB for user record:', user.id);
        // Default to parent or keep null
        setUserRole(null);
        return;
      }

      console.log('Raw DB Role data received:', data);
      
      const roleData = data as any;
      let finalRole = roleData.role || 'parent';
      
      if (roleData.is_super_admin === true || roleData.role === 'super_admin') {
         finalRole = 'super_admin';
      }
      
      const finalStatus = roleData.verification_status || 'unverified';
      setUserRole(finalRole as AppRole);
      setVerificationStatus(finalStatus);

      const perms: string[] = [];
      if (roleData.custom_roles?.role_permissions) {
        roleData.custom_roles.role_permissions.forEach((rp: any) => {
          if (rp.permissions?.name) {
            perms.push(rp.permissions.name);
          }
        });
      }
      if (perms.length > 0) {
        setUserPermissions(perms);
      }

      // Cache the role and permissions for instant recovery on next load
      localStorage.setItem(`auth_role_${user.id}`, JSON.stringify({
        role: finalRole,
        permissions: perms,
        status: finalStatus,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error("Exception in refreshUserRole:", err);
      setUserRole(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [user?.id, toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setVerificationStatus(null);
      localStorage.removeItem('qa_simulate_role');

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
          refreshMfaStatus();
          // Defer role fetch but don't set loading false until it's done if we're authenticated
          refreshUserRole();
        } else if (!session?.user && mounted) {
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
          await refreshMfaStatus();
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
  // QA Simulation Mode (Development Only)
  const [qaRole, setQaRole] = useState<AppRole | null>(null);

  useEffect(() => {
    const simulateRole = localStorage.getItem('qa_simulate_role');
    if (simulateRole) setQaRole(simulateRole as AppRole);
    
    const handleStorageChange = () => {
      setQaRole((localStorage.getItem('qa_simulate_role') as AppRole) || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Override role flags if in QA mode
  const effectiveRole = qaRole || userRole;
  const effectiveUser = qaRole ? ({ id: '00000000-0000-0000-0000-000000000000', email: 'qa@test.com' } as any) : user;

  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'super_admin';
  const isSuperAdmin = effectiveRole === 'super_admin';
  const isParent = effectiveRole === 'parent';
  const isStaff = effectiveRole === 'staff';
  const isTeacher = effectiveRole === 'teacher';
  const isTeacherAssistant = effectiveRole === 'teacher_assistant';
  const isVolunteer = effectiveRole === 'volunteer';
  const isKiosk = effectiveRole === 'kiosk';
  const isRegularUser = effectiveRole === 'regular_user';

  const isVerifiedStaff =
    (isStaff || isTeacher || isTeacherAssistant || isAdmin) &&
    (qaRole ? true : (verificationStatus === 'verified'));

  const value = {
    user: effectiveUser,
    session: qaRole ? ({} as any) : session,
    userRole: effectiveRole,
    loading: qaRole ? false : loading,
    signOut,
    refreshUserRole,
    refreshMfaStatus,
    isAdmin,
    isSuperAdmin,
    isParent,
    isStaff,
    isTeacher,
    isTeacherAssistant,
    isVolunteer,
    isKiosk,
    isRegularUser,
    verificationStatus: qaRole ? 'verified' : verificationStatus,
    isVerifiedStaff,
    mfaLevel,
    isMfaPending: qaRole ? false : isMfaPending,
    isMfaEnrolled,
    mfaFactors,
    hasRole: (role: AppRole) => {
      if (!effectiveRole) return false;
      if (effectiveRole === 'super_admin') return true;
      return effectiveRole === role;
    },
    hasPermission: (permissionName: string) => {
      if (effectiveRole === 'super_admin') return true;
      if (qaRole) return true; // Grant all permissions in QA mode
      return userPermissions.includes(permissionName);
    },
    userPermissions,
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

