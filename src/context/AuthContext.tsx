
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

const withTimeout = <T,>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms))
  ]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  const [user, setUser] = useState<any | null>(null);
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
      console.error("[Auth] Login error:", e);
      toast({ title: "Login Failed", description: "Could not sign you in with Microsoft.", variant: "destructive" });
    }
  };

  // ─── MSAL Sign Out ──────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      localStorage.removeItem('session_backup');
      await instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/"
      });
    } catch (e) {
      console.error("[Auth] Logout error:", e);
    }
  };

  // ─── Role Fetching (Database) ───────────────────────────────────────────────
  const fetchRoleForUser = useCallback(async (userId: string) => {
    console.log('[Auth] Fetching role from Data Bridge for:', userId);
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

  const refreshUserRole = useCallback(async () => {
    if (user?.id) await fetchRoleForUser(user.id);
  }, [user?.id, fetchRoleForUser]);

  // ─── MSAL Account Sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      if (isAuthenticated && accounts.length > 0) {
        const account = accounts[0];
        const msalUser = {
          id: account.localAccountId || account.homeAccountId, // This maps to user_id in DB
          email: account.username,
          name: account.name,
          user_metadata: {
            full_name: account.name,
            email: account.username
          }
        };
        setUser(msalUser);
        fetchRoleForUser(msalUser.id).finally(() => setLoading(false));
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    }
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
    session: user ? { access_token: "msal-managed" } : null,
    userRole,
    loading: loading || inProgress !== InteractionStatus.None,
    mfaLevel: 'aal1', // MSAL handles MFA internally
    isMfaPending: false,
    isMfaEnrolled: true,
    mfaFactors: [],
    signOut,
    signIn,
    refreshUserRole,
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
