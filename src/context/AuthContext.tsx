
import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const initialLoadDone = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // ─── Utility: Timeout Promise ──────────────────────────────────────────────
  const withTimeout = <T>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms))
    ]);
  };

  // ─── Restore cached role on mount ───────────────────────────────────────────
  useEffect(() => {
    const backup = localStorage.getItem('session_backup');
    if (backup) {
      try {
        const { userId } = JSON.parse(backup);
        if (userId) {
          const cachedRole = localStorage.getItem(`auth_role_${userId}`);
          if (cachedRole) {
            const { role, permissions, status } = JSON.parse(cachedRole);
            console.log('[Auth] Restoring cached role:', role, 'for user:', userId);
            setUserRole(role);
            setUserPermissions(permissions || []);
            setVerificationStatus(status);
            // We can stop initial loading if we have cached data, 
            // but we'll still let initializeAuth verify it.
          }
        }
      } catch (e) { 
        console.warn('[Auth] Failed to restore cached role', e);
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

  // ─── Role Fetching with Hard Timeout ─────────────────────────────────────────
  const fetchRoleForUser = useCallback(async (userId: string) => {
    console.log('[Auth] Fetching role for:', userId);
    currentUserIdRef.current = userId;

    try {
      const rolePromise = supabase
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

      const { data, error } = await withTimeout(rolePromise, 5000, 'Role fetch timed out');

      if (currentUserIdRef.current !== userId) return;

      if (error) {
        console.error("[Auth] Error fetching user role:", error);
        return;
      }

      if (!data) {
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
          if (rp.permissions?.name) perms.push(rp.permissions.name);
        });
      }
      setUserPermissions(perms);

      localStorage.setItem(`auth_role_${userId}`, JSON.stringify({
        role: finalRole,
        permissions: perms,
        status: finalStatus,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error("[Auth] Exception in fetchRoleForUser:", err);
    }
  }, []);

  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setLoading(false);
      return;
    }
    await fetchRoleForUser(user.id);
    setLoading(false);
  }, [user?.id, fetchRoleForUser]);

  // ─── Sign Out ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      // Clear state regardless of server error
      setUser(null);
      setSession(null);
      setUserRole(null);
      setVerificationStatus(null);
      setUserPermissions([]);
      localStorage.removeItem('qa_simulate_role');
      localStorage.removeItem('session_backup');

      if (error) console.error("[Auth] Error signing out:", error);
      toast({ title: "Signed Out", description: "Your session has ended." });
    } catch (error) {
      console.error("[Auth] Exception during sign out:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ─── Idle Session Timeout ──────────────────────────────────────────────────
  const idleTime = (userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher') 
    ? 30 * 60 * 1000 
    : 4 * 60 * 60 * 1000;

  useIdleTimeout(() => {
    if (user) {
      console.log('[Auth] Session idle timeout reached.');
      toast({ title: "Session Expired", description: "You have been signed out due to inactivity.", variant: "destructive" });
      signOut();
    }
  }, idleTime, !!user && userRole !== 'kiosk');

  // ─── Initialization ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Failsafe: never stay loading for more than 7 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Safety threshold reached. Forcing app initialization.');
        setLoading(false);
      }
    }, 7000);

    const processSession = async (newSession: Session | null) => {
      if (!mounted) return;
      
      if (!newSession?.user) {
        console.log('[Auth] No session found');
        setSession(null);
        setUser(null);
        setUserRole(null);
        setVerificationStatus(null);
        setUserPermissions([]);
        setLoading(false);
        return;
      }

      console.log('[Auth] Session established for:', newSession.user.id);
      
      // Update state
      setSession(newSession);
      setUser(newSession.user);
      
      // PERSIST: Set session backup for instant role restoration on reload
      localStorage.setItem('session_backup', JSON.stringify({ 
        userId: newSession.user.id,
        email: newSession.user.email,
        timestamp: Date.now() 
      }));

      // If we already have a cached role for THIS user, we can stop loading early
      const cachedRole = localStorage.getItem(`auth_role_${newSession.user.id}`);
      if (cachedRole) {
        try {
          const { role, permissions, status } = JSON.parse(cachedRole);
          setUserRole(role);
          setUserPermissions(permissions || []);
          setVerificationStatus(status);
          setLoading(false); // Stop loading early!
        } catch (e) { /* ignore */ }
      }

      // Fetch fresh data in the background
      await Promise.allSettled([
        fetchRoleForUser(newSession.user.id),
        refreshMfaStatus(),
      ]);

      if (mounted) setLoading(false);
    };

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing...');
        // We use both getSession and onAuthStateChange for maximum reliability
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession) {
          console.log('[Auth] Initial session found');
          await processSession(initialSession);
        } else {
          console.log('[Auth] No initial session found');
          setLoading(false);
        }
        initialLoadDone.current = true;
      } catch (error) {
        console.error("[Auth] Initialization failed:", error);
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('[Auth] State change event:', event);
      
      if (event === 'SIGNED_OUT') {
        await processSession(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'MFA_CHALLENGE_VERIFIED') {
        await processSession(newSession);
      }
      
      initialLoadDone.current = true;
    });

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); 

  // ─── QA Simulation ───────────────────────────────────────────────────────────
  const [qaRole, setQaRole] = useState<AppRole | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const simulateRole = localStorage.getItem('qa_simulate_role');
    if (simulateRole) setQaRole(simulateRole as AppRole);
    const handleStorage = () => setQaRole((localStorage.getItem('qa_simulate_role') as AppRole) || null);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ─── Derived State ───────────────────────────────────────────────────────────
  const effectiveRole = qaRole || userRole;
  const effectiveUser = qaRole ? ({ id: 'qa-user', email: 'qa@test.com' } as any) : user;

  const isSuperAdmin = effectiveRole === 'super_admin';
  const isAdmin = effectiveRole === 'admin' || isSuperAdmin;
  const isStaff = effectiveRole === 'staff';
  const isTeacher = effectiveRole === 'teacher';
  const isTeacherAssistant = effectiveRole === 'teacher_assistant';
  const isParent = effectiveRole === 'parent';
  const isVolunteer = effectiveRole === 'volunteer';
  const isKiosk = effectiveRole === 'kiosk';
  const isRegularUser = effectiveRole === 'regular_user';

  const isVerifiedStaff = (isStaff || isTeacher || isTeacherAssistant || isAdmin) && (qaRole ? true : (verificationStatus === 'verified'));

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
    hasRole: (role: AppRole) => effectiveRole === 'super_admin' || effectiveRole === role,
    hasPermission: (permissionName: string) => effectiveRole === 'super_admin' || qaRole !== null || userPermissions.includes(permissionName),
    userPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
