
import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { supabase } from '@/integrations/supabase/client';
import { apiFetch } from '@/lib/apiClient';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/useToast';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { loginRequest } from '@/lib/authConfig';

export interface AuthContextType {
  user: any | null;
  session: any | null;
  userRole: AppRole | null;
  loading: boolean;
  mfaLevel: 'aal1' | 'aal2';
  isMfaPending: boolean;
  isMfaEnrolled: boolean;
  mfaFactors: any[];
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
  signInWithPassword: (email: string, pass: string) => Promise<{ data: any; error: any }>;
  sendNativeCode: (email: string) => Promise<void>;
  verifyNativeCode: (email: string, code: string) => Promise<void>;
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
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMfaEnrolled, setIsMfaEnrolled] = useState(false);
  const [isMfaPending, setIsMfaPending] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaLevel, setMfaLevel] = useState<'aal1' | 'aal2'>('aal1');

  const currentUserIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // ─── MSAL Sign In ───────────────────────────────────────────────────────────
  const signIn = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (e) {
      console.error("[Auth] MSAL error:", e);
      throw e;
    }
  };

  // ─── Email/Pass Sign In ─────────────────────────────────────────────────────
  const signInWithPassword = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data && !data.mfaRequired) {
      setSession(data.session);
      setUser(data.user || data.session?.user);
    }
    return { data, error };
  };

  // ─── Native Bridge Auth (Option 2) ─────────────────────────────────────────
  const sendNativeCode = async (email: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send code');
    }
  };

  const verifyNativeCode = async (email: string, code: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Invalid code');
    }
    const { token, profile } = await res.json();
    localStorage.setItem('bridge_token', token);
    setUser(profile);
    setSession({ access_token: token });
    await fetchRoleForUser(profile.id);
  };

  // ─── Universal Sign Out ─────────────────────────────────────────────────────
  const signOut = async () => {
    console.log('[Auth] Initiating sign out...');
    try {
      // 1. Clear Local State IMMEDIATELY
      setUser(null);
      setSession(null);
      setUserRole(null);
      localStorage.removeItem('bridge_token');

      // 2. Try to clear Supabase
      try {
        await supabase.auth.signOut();
      } catch (sbErr) {
        console.warn("[Auth] Supabase signout error:", sbErr);
      }
      
      // 3. Try to clear MSAL
      if (accounts.length > 0) {
        try {
          await instance.logoutPopup({
            postLogoutRedirectUri: "/",
            mainWindowRedirectUri: "/",
            // Use 'none' to avoid interaction if possible during tests
            // but for production popup is safer
          });
        } catch (msalErr) {
          console.warn("[Auth] MSAL logout error:", msalErr);
        }
      }

      // 4. Force reload as a final fail-safe to clear all memory states
      window.location.href = "/";
    } catch (e) {
      console.error("[Auth] Global sign out error:", e);
      // Fallback
      localStorage.clear();
      window.location.href = "/";
    }
  };

  // ─── Role Fetching (Database) ───────────────────────────────────────────────
  const fetchRoleForUser = useCallback(async (userId: string) => {
    console.log('[Auth] Syncing roles from Azure Bridge for:', userId);
    currentUserIdRef.current = userId;

    try {
      const data = await apiFetch('/api/profile');

      if (currentUserIdRef.current !== userId) return;

      if (!data) {
        console.warn("[Auth] No profile returned from Bridge");
        setUserRole('parent');
        return;
      }

      // Sync the user state with the database profile (ensures user.id is the UUID)
      setUser(data);

      let finalRole = data.role || 'parent';
      if (data.is_super_admin) finalRole = 'super_admin';
      
      setUserRole(finalRole as AppRole);
      setVerificationStatus(data.verification_status || 'unverified');
      setUserPermissions(data.permissions || []);

    } catch (err) {
      console.error("[Auth] Data Bridge sync error:", err);
      setUserRole('parent');
    }
  }, []);

  const refreshMfaStatus = useCallback(async () => {
    if (!localStorage.getItem('bridge_token')) {
      setIsMfaEnrolled(false);
      setMfaFactors([]);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/mfa/list`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMfaFactors(data.all || []);
        setIsMfaEnrolled(data.all && data.all.length > 0);
      }
    } catch (err) {
      console.error('[Auth] Error refreshing MFA status:', err);
    }
  }, []);

  // ─── Session Sync Logic ─────────────────────────────────────────────────────
  useEffect(() => {
    const syncSession = async () => {
      console.log('[Auth] Syncing session... MSAL Status:', inProgress);
      
      // 1. Wait for MSAL to settle before deciding there's no user
      if (inProgress !== InteractionStatus.None) {
        console.log('[Auth] MSAL is busy, waiting...');
        return;
      }

      try {
        // Priority 1: MSAL (Microsoft)
        if (isAuthenticated && accounts.length > 0) {
          console.log('[Auth] MSAL Authenticated');
          const account = accounts[0];
          const msalUser = {
            id: account.localAccountId || account.homeAccountId,
            email: account.username,
            name: account.name,
            user_metadata: { full_name: account.name, email: account.username }
          };
          setUser(msalUser);
          setSession({ access_token: "msal-managed" });
          await fetchRoleForUser(msalUser.id);
        } 
        // Priority 2: Native Bridge Token
        else if (localStorage.getItem('bridge_token')) {
          console.log('[Auth] Bridge Token Found');
          const token = localStorage.getItem('bridge_token');
          setSession({ access_token: token });
          try {
            const profile = await apiFetch('/api/profile');
            setUser(profile);
            await fetchRoleForUser(profile.id);
            await refreshMfaStatus();
          } catch (e) {
            console.error("[Auth] Bridge session invalid:", e);
            localStorage.removeItem('bridge_token');
            setUser(null);
            setSession(null);
          }
        }
        // Priority 3: Supabase (Email/Pass)
        else {
          console.log('[Auth] Checking Supabase Session');
          const { data: { session: sbSession } } = await supabase.auth.getSession();
          if (sbSession) {
            setUser(sbSession.user);
            setSession(sbSession);
            await fetchRoleForUser(sbSession.user.id);
          } else {
            console.log('[Auth] No active session found');
            setUser(null);
            setSession(null);
            setUserRole(null);
          }
        }
      } catch (err) {
        console.error('[Auth] Global Sync Error:', err);
      } finally {
        setLoading(false);
      }
    };

    syncSession();

    // Listen for Supabase changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !accounts.length) {
        setUser(session.user);
        setSession(session);
        fetchRoleForUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [isAuthenticated, accounts, inProgress, fetchRoleForUser]);

  // ─── Idle Timeout ───────────────────────────────────────────────────────────
  const idleTime = (userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher') 
    ? 30 * 60 * 1000 : 4 * 60 * 60 * 1000;

  useIdleTimeout(() => {
    if (user) {
      toast({ title: "Session Expired", description: "Signed out due to inactivity.", variant: "destructive" });
      signOut();
    }
  }, idleTime, !!user && userRole !== 'kiosk');

  // ─── Derived State ──────────────────────────────────────────────────────────
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isParent = userRole === 'parent';
  const isStaff = userRole === 'staff';
  const isTeacher = userRole === 'teacher';
  const isTeacherAssistant = userRole === 'teacher_assistant';
  const isVolunteer = userRole === 'volunteer';
  const isKiosk = userRole === 'kiosk';
  const isRegularUser = userRole === 'regular_user';
  
  const isVerifiedStaff = (isStaff || isTeacher || isTeacherAssistant || isAdmin) && verificationStatus === 'verified';

  const value = {
    user,
    session,
    userRole,
    loading,
    mfaLevel,
    isMfaPending,
    isMfaEnrolled,
    mfaFactors,
    signOut,
    signIn,
    signInWithPassword,
    sendNativeCode,
    verifyNativeCode,
    refreshUserRole: async () => { if (user) fetchRoleForUser(user.id); },
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
    verificationStatus,
    isVerifiedStaff,
    hasRole: (role: AppRole) => isSuperAdmin || userRole === role,
    hasPermission: (perm: string) => isSuperAdmin || userPermissions.includes(perm),
    userPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
