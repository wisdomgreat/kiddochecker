
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

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

  // Track whether initial load is complete to prevent double-processing
  const initialLoadDone = useRef(false);
  // Track the current user id for role fetching to prevent stale closures
  const currentUserIdRef = useRef<string | null>(null);

  const { toast } = useToast();

  // ─── Restore cached role on mount for instant UI ─────────────────────────────
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
        }
      } catch (e) {
        // Ignore corrupt cache
      }
    }
  }, []);

  // ─── MFA Status ──────────────────────────────────────────────────────────────
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

  // ─── Role Fetching (stable — no deps that cause re-creation) ─────────────────
  const fetchRoleForUser = useCallback(async (userId: string) => {
    console.log('Fetching role for:', userId);
    currentUserIdRef.current = userId;

    try {
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
        .eq('user_id', userId)
        .maybeSingle();

      // If user changed while we were fetching, discard stale result
      if (currentUserIdRef.current !== userId) return;

      if (error) {
        console.error("Error fetching user role:", error);
        return;
      }

      if (!data) {
        console.warn('No role found for user:', userId);
        setUserRole(null);
        return;
      }

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

      // Cache for instant recovery
      localStorage.setItem(`auth_role_${userId}`, JSON.stringify({
        role: finalRole,
        permissions: perms,
        status: finalStatus,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error("Exception in fetchRoleForUser:", err);
    }
  }, []);

  // Public refreshUserRole that uses current user
  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setLoading(false);
      return;
    }
    await fetchRoleForUser(user.id);
    setLoading(false);
  }, [user?.id, fetchRoleForUser]);

  // ─── Session backup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (session && user) {
      localStorage.setItem('session_backup', JSON.stringify({
        userId: user.id,
        timestamp: Date.now()
      }));
    } else if (!session && !user) {
      localStorage.removeItem('session_backup');
    }
  }, [session, user]);

  // ─── Network status ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      toast({
        title: "Connection Restored",
        description: "You're back online.",
      });
    };

    const handleOffline = () => {
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

  // ─── Sign Out ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setVerificationStatus(null);
      setUserPermissions([]);
      localStorage.removeItem('qa_simulate_role');
      localStorage.removeItem('session_backup');

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
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ─── Idle Session Timeout ──────────────────────────────────────────────────
  // Auto-logout staff/admins after 30 mins, parents after 4 hours
  const idleTime = (userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher') 
    ? 30 * 60 * 1000 
    : 4 * 60 * 60 * 1000;

  useIdleTimeout(() => {
    if (user) {
      console.log('Session idle timeout reached. Signing out.');
      toast({
        title: "Session Expired",
        description: "You have been signed out due to inactivity.",
        variant: "destructive"
      });
      signOut();
    }
  }, idleTime, !!user && userRole !== 'kiosk');

  // ─── Core Auth Initialization (runs ONCE) ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Hard safety timeout: never stay loading for more than 6 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth safety timeout hit — forcing loading=false');
        setLoading(false);
      }
    }, 6000);

    // Helper to process a session
    const processSession = async (newSession: Session | null) => {
      if (!mounted) return;

      if (!newSession?.user) {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setVerificationStatus(null);
        setLoading(false);
        return;
      }

      setSession(newSession);
      setUser(newSession.user);

      // Fetch role + MFA in parallel for speed
      await Promise.allSettled([
        fetchRoleForUser(newSession.user.id),
        refreshMfaStatus(),
      ]);

      if (mounted) {
        setLoading(false);
      }
    };

    // 1. Get the initial session first (before subscribing)
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session fetch timeout')), 8000)
          )
        ]);

        if (!mounted) return;

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        await processSession(initialSession);
        initialLoadDone.current = true;

      } catch (error) {
        console.error("Session initialization failed:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 2. Subscribe to auth state changes (for login/logout AFTER initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        // Skip events during initial load — we handle it in initializeAuth
        if (!initialLoadDone.current && event === 'INITIAL_SESSION') {
          return;
        }

        console.log('Auth event:', event);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setVerificationStatus(null);
          setUserPermissions([]);
          localStorage.removeItem('session_backup');
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Use setTimeout to avoid Supabase deadlock warning
          setTimeout(() => {
            if (mounted) {
              processSession(newSession);
            }
          }, 0);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — runs once on mount

  // ─── QA Simulation Mode (Development Only) ────────────────────────────────────
  const [qaRole, setQaRole] = useState<AppRole | null>(null);

  useEffect(() => {
    // SECURITY: Only allow role simulation in development mode
    if (!import.meta.env.DEV) return;

    const simulateRole = localStorage.getItem('qa_simulate_role');
    if (simulateRole) setQaRole(simulateRole as AppRole);

    const handleStorageChange = () => {
      setQaRole((localStorage.getItem('qa_simulate_role') as AppRole) || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ─── Compute derived values ───────────────────────────────────────────────────
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

  const hasRole = useCallback((role: AppRole): boolean => {
    if (!effectiveRole) return false;
    if (effectiveRole === 'super_admin') return true;
    return effectiveRole === role;
  }, [effectiveRole]);

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
    hasRole,
    hasPermission: (permissionName: string) => {
      if (effectiveRole === 'super_admin') return true;
      if (qaRole) return true;
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
