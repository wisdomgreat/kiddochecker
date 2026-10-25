
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldX, ShieldAlert, Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: string;
  /** Optional override: where to redirect on access denied. Defaults to role-based home. */
  redirectTo?: string;
}

/** Maps each role to its default home dashboard. */
const ROLE_HOME: Record<AppRole, string> = {
  super_admin: '/',
  admin: '/',
  staff: '/',
  teacher: '/',
  teacher_assistant: '/',
  volunteer: '/',
  kiosk: '/check-in',
  parent: '/',
  regular_user: '/',
};

const RoleBasedRoute = ({ children, allowedRoles, requiredPermission, redirectTo }: RoleBasedRouteProps) => {
  const { user, userRole, loading, isVerifiedStaff, hasPermission, refreshUserRole } = useAuth();
  const location = useLocation();
  const [waitingForRole, setWaitingForRole] = useState(false);

  // If user exists but role is null, give it a brief window
  useEffect(() => {
    if (user && !userRole && !loading) {
      setWaitingForRole(true);
      refreshUserRole();
      const timeout = setTimeout(() => setWaitingForRole(false), 3000);
      return () => clearTimeout(timeout);
    } else {
      setWaitingForRole(false);
    }
  }, [user, userRole, loading, refreshUserRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Still waiting for role? Brief loading state
  if (!userRole && waitingForRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Setting up your session...</p>
        </div>
      </div>
    );
  }

  // Access check logic:
  // 1. SuperAdmins always have access
  // 2. If allowedRoles is specified, user must have one of those roles
  // 3. If requiredPermission is specified, user must have that permission
  // 4. If both are specified, user must satisfy BOTH conditions
  
  let hasAccess = userRole === 'super_admin';

  if (!hasAccess && userRole) {
    const roleMatch = allowedRoles ? allowedRoles.includes(userRole) : true;
    const permissionMatch = requiredPermission ? hasPermission(requiredPermission) : true;
    hasAccess = roleMatch && permissionMatch;
  }

  if (hasAccess) {
    // SECURITY UPGRADE: Force onboarding for unverified staff
    const isStaffType = userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant';
    const isAllowedUnverifiedPath = ['/', '/staff-dashboard', '/dashboard', '/parent-dashboard', '/staff/documents', '/profile'].includes(location.pathname);
    
    if (isStaffType && !isVerifiedStaff && !isAllowedUnverifiedPath) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6 font-['Outfit']">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Staff Verification Required</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Access to this section is restricted until your staff documents are submitted and verified by an administrator.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/staff/documents'}>
                Submit Documents
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  // Redirect to a specific path if provided
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // If authenticated user lacks access, provide informative feedback instead of silent bounce
  if (userRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6 font-['Outfit']">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center justify-center">
            <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              You do not have administrative permissions to view this page. This action has been logged for security.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={() => window.location.href = ROLE_HOME[userRole] || '/'}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role not yet determined — show error with actions instead of dead-end
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <Alert className="border-amber-200 bg-amber-50">
          <ShieldX className="h-4 w-4 text-amber-600" />
          <AlertDescription className="font-medium text-amber-800">
            Your account role could not be determined.
          </AlertDescription>
        </Alert>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => refreshUserRole()} className="gap-2">
            <Loader2 className="h-4 w-4" />
            Retry
          </Button>
          <Button onClick={() => window.location.href = '/login'}>
            Re-Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedRoute;
