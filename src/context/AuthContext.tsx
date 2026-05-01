
import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/useToast';
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

// ─── Utility: Timeout Promise ──────────────────────────────────────────────
const withTimeout = <T,>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms))
  ]);
};

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
      console.log('[Auth] Refreshing MFA status...');
      
      const levelPromise = supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data, error } = await withTimeout(levelPromise, 4000, 'MFA level fetch timed out');
      
      if (!error && data) {
        setMfaLevel(data.currentLevel as any || 'aal1');
        setIsMfaPending(data.nextLevel === 'aal2' && data.currentLevel !== 'aal2');
      }

      const factorsPromise = supabase.auth.mfa.listFactors();
      const { data: factors, error: factorsError } = await withTimeout(factorsPromise, 4000, 'MFA factors fetch timed out');
      
      if (!factorsError && factors) {
        setMfaFactors(factors.all || []);
        setIsMfaEnrolled((factors.all || []).some(f => f.status === 'verified'));
      }
      console.log('[Auth] MFA status updated:', data?.currentLevel);
    } catch (e) {
      console.warn("[Auth] MFA status refresh failed or timed out", e);
    }
  }, []); // Removed withTimeout as it's now external and stable

  // ─── Role Fetching with Hard Timeout ─────────────────────────────────────────
  const fetchRoleForUser = useCallback(async (userId: string, metadataRole?: string) => {
    console.log('[Auth] Fetching role for:', userId);
    currentUserIdRef.current = userId;

    try {
      // 1. Fetch Role & Custom Role Permissions
      console.log('[Auth] Querying user_roles for:', userId);
      const rolePromise = supabase
        .from('user_roles')
        .select(`
          role,
          is_super_admin,
          verification_status,
          custom_roles (
            role_permissions (
              permissions (name)
            )
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      // 2. Fetch Security Group Permissions
      const groupsPromise = supabase
        .from('user_security_groups')
        .select(`
          security_groups (
            group_permissions (
              permissions (name)
            )
          )
        `)
        .eq('user_id', userId);

      const [roleRes, groupsRes] = await Promise.all([
        withTimeout(rolePromise, 5000, 'Role fetch timed out'),
        withTimeout(groupsPromise, 5000, 'Security groups fetch timed out')
      ]);

      if (currentUserIdRef.current !== userId) return;

      if (roleRes.error) {
        console.error("[Auth] Role query error:", roleRes.error);
        // Don't crash the whole app if the query fails, just set a safe default
        setUserRole('parent');
        return;
      }

      const roleData = roleRes.data as any;
      if (!roleData) {
        console.warn("[Auth] No role data found in DB, defaulting to parent");
        setUserRole('parent');
        return;
      }

      console.log('[Auth] Raw role data:', roleData);

      let finalRole = roleData.role || metadataRole || 'parent';
      if (roleData.is_super_admin === true || roleData.role === 'super_admin' || metadataRole === 'super_admin') {
        finalRole = 'super_admin';
      }

      const finalStatus = roleData.verification_status || 'unverified';
      
      // FALLBACK: If DB says parent but we suspect otherwise, or if DB is empty
      let confirmedRole = finalRole;
      if (confirmedRole === 'parent' && currentUserIdRef.current) {
        // We might want to check metadata here if we had access to the user object, 
        // but fetchRoleForUser is primarily DB-driven.
      }

      setUserRole(confirmedRole as AppRole);
      setVerificationStatus(finalStatus);

      const perms = new Set<string>();
      
      // 1. Role-based permissions
      // Handle the case where custom_roles might be an array or single object
      const customRoles = Array.isArray(roleData.custom_roles) ? roleData.custom_roles[0] : roleData.custom_roles;
      const rolePerms = customRoles?.role_permissions;
      
      if (Array.isArray(rolePerms)) {
        rolePerms.forEach((rp: any) => {
          if (rp.permissions?.name) perms.add(rp.permissions.name);
        });
      }

      // 2. Security Group permissions
      const groupAssignments = groupsRes.data;
      if (Array.isArray(groupAssignments)) {
        groupAssignments.forEach((assignment: any) => {
          // Handle potential array from join
          const sg = Array.isArray(assignment.security_groups) ? assignment.security_groups[0] : assignment.security_groups;
          const groupPerms = sg?.group_permissions;
          if (Array.isArray(groupPerms)) {
            groupPerms.forEach((gp: any) => {
              if (gp.permissions?.name) perms.add(gp.permissions.name);
            });
          }
        });
      }

      const finalPerms = Array.from(perms);
      setUserPermissions(finalPerms);

      localStorage.setItem(`auth_role_${userId}`, JSON.stringify({
        role: finalRole,
        permissions: finalPerms,
        status: finalStatus,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error("[Auth] Exception in fetchRoleForUser:", err);
      // Ensure we don't leave the app in a broken state
      setUserRole((metadataRole as AppRole) || 'parent');
    }
  }, []);

  const refreshUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setLoading(false);
      return;
    }
    await fetchRoleForUser(user.id, user.user_metadata?.role);
    setLoading(false);
  }, [user?.id, user?.user_metadata?.role, fetchRoleForUser]);

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
    let authSubscription: any = null;

    // Failsafe: never stay loading for more than 7 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] SAFETY THRESHOLD: Forcing initialization after 7s hang');
        setLoading(false);
      }
    }, 7000);

    const processSession = async (newSession: Session | null, source: string) => {
      if (!mounted) return;
      console.log(`[Auth] Processing session from ${source}:`, newSession?.user?.id || 'NO_USER');
      
      if (!newSession?.user) {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setVerificationStatus(null);
        setUserPermissions([]);
        if (mounted) setLoading(false);
        return;
      }

      const userId = newSession.user.id;
      const cachedRoleStr = localStorage.getItem(`auth_role_${userId}`);
      
      // Update state
      setSession(newSession);
      setUser(newSession.user);
      
      // PERSIST: Set session backup for instant role restoration on reload
      try {
        localStorage.setItem('session_backup', JSON.stringify({ 
          userId,
          email: newSession.user.email,
          timestamp: Date.now() 
        }));
 
        // 1. Check for metadata role (fastest, direct from JWT/User object)
        const metadataRole = newSession.user.user_metadata?.role;
        if (metadataRole && !cachedRoleStr) {
          console.log('[Auth] Using metadata role as initial source:', metadataRole);
          setUserRole(metadataRole as AppRole);
          setLoading(false); // Stop UI spinner early if we have a role from metadata
        }
 
        // 2. Check for cached role
        if (cachedRoleStr) {
          const { role, permissions, status } = JSON.parse(cachedRoleStr);
          // If metadata exists and contradicts cache, metadata wins for the 'role' part
          const effectiveInitialRole = metadataRole || role;
          setUserRole(effectiveInitialRole);
          setUserPermissions(permissions || []);
          setVerificationStatus(status);
          console.log('[Auth] Pre-loaded role (metadata/cache):', effectiveInitialRole);
          setLoading(false); // Stop UI spinner early
        }
      } catch (e) {
        console.warn('[Auth] Storage error during session processing:', e);
      }
 
      // Always fetch fresh data in the background
      try {
        const currentMetadataRole = newSession.user.user_metadata?.role;
        await Promise.allSettled([
          fetchRoleForUser(userId, currentMetadataRole),
          refreshMfaStatus(),
        ]);
      } catch (e) {
        console.error('[Auth] Background sync failed:', e);
      }

      if (mounted) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing system...');
        
        // 1. Check for existing session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] getSession error:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (!mounted) return;
        
        if (initialSession) {
          console.log('[Auth] Initial session detected');
          await processSession(initialSession, 'INITIAL_LOAD');
        } else {
          console.log('[Auth] No initial session detected');
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error("[Auth] Fatal initialization error:", error);
        if (mounted) setLoading(false);
      }
    };

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      console.log('[Auth] EVENT:', event);
      
      if (event === 'SIGNED_OUT') {
        await processSession(null, 'EVENT_SIGNED_OUT');
      } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED', 'MFA_CHALLENGE_VERIFIED'].includes(event)) {
        await processSession(newSession, `EVENT_${event}`);
      }
    });
    
    authSubscription = subscription;

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []); // Stable on mount - background syncs are handled within the effect and processSession 

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
  const effectiveUser = qaRole ? ({ ...user, id: user?.id || '00000000-0000-0000-0000-000000000000' } as any) : user;

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
