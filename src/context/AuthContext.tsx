
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
  signInWithPassword: (email: string, pass: string) => Promise<void>;
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
    setSession(data.session);
    setUser(data.user);
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
    try {
      // 1. Clear Supabase
      await supabase.auth.signOut();
      
      // 2. Clear MSAL
      if (accounts.length > 0) {
        await instance.logoutPopup({
          postLogoutRedirectUri: "/",
          mainWindowRedirectUri: "/"
        });
      }

      setUser(null);
      setSession(null);
      setUserRole(null);
      localStorage.removeItem('bridge_token');
    } catch (e) {
      console.error("[Auth] Sign out error:", e);
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

  // ─── Session Sync Logic ─────────────────────────────────────────────────────
  useEffect(() => {
    const syncSession = async () => {
      // Priority 1: MSAL (Microsoft)
      if (inProgress === InteractionStatus.None && isAuthenticated && accounts.length > 0) {
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
        setLoading(false);
      } 
      // Priority 2: Native Bridge Token
      else if (localStorage.getItem('bridge_token')) {
        const token = localStorage.getItem('bridge_token');
        setSession({ access_token: token });
        try {
          const profile = await apiFetch('/api/profile');
          setUser(profile);
          await fetchRoleForUser(profile.id);
        } catch (e) {
          console.error("[Auth] Bridge session invalid:", e);
          localStorage.removeItem('bridge_token');
        }
        setLoading(false);
      }
      // Priority 3: Supabase (Email/Pass)
      else {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession) {
          setUser(sbSession.user);
          setSession(sbSession);
          await fetchRoleForUser(sbSession.user.id);
        } else {
          setUser(null);
          setSession(null);
          setUserRole(null);
        }
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
  
  const isVerifiedStaff = (isStaff || isTeacher || isAdmin) && verificationStatus === 'verified';

  const value = {
    user,
    session,
    userRole,
    loading,
    mfaLevel: 'aal1',
    isMfaPending: false,
    isMfaEnrolled: true,
    mfaFactors: [],
    signOut,
    signIn,
    signInWithPassword,
    sendNativeCode,
    verifyNativeCode,
    refreshUserRole: async () => { if (user) fetchRoleForUser(user.id); },
    refreshMfaStatus: async () => {},
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
