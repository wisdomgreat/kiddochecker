
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  /** Optional override: where to redirect on access denied. Defaults to role-based home. */
  redirectTo?: string;
}

/** Maps each role to its default home dashboard. */
const ROLE_HOME: Record<AppRole, string> = {
  super_admin: '/admin-dashboard',
  admin: '/admin-dashboard',
  staff: '/staff-dashboard',
  teacher: '/staff-dashboard',
  teacher_assistant: '/staff-dashboard',
  volunteer: '/staff-dashboard',
  kiosk: '/check-in',
  parent: '/parent-dashboard',
};

const RoleBasedRoute = ({ children, allowedRoles, redirectTo }: RoleBasedRouteProps) => {
  const { user, userRole, loading, isVerifiedStaff } = useAuth();
  const location = useLocation();

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

  // super_admin always has access to everything
  const hasAccess = userRole === 'super_admin' || (userRole ? allowedRoles.includes(userRole) : false);

  if (hasAccess) {
    // SECURITY UPGRADE: Force onboarding for unverified staff
    // If the user is staff/teacher, check if they are verified before granting strict access.
    // They are only allowed to see their base dashboard (which renders the onboarding UI) or profile.
    
    const isStaffType = userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant';
    const isAllowedUnverifiedPath = ['/staff-dashboard', '/dashboard', '/', '/parent-dashboard'].includes(location.pathname);
    
    if (isStaffType && !isVerifiedStaff && !isAllowedUnverifiedPath) {
      console.warn("RoleBasedRoute: Blocking unverified staff from accessing", location.pathname);
      return <Navigate to="/staff-dashboard" replace />;
    }

    return <>{children}</>;
  }

  // Redirect to a specific path if provided
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // If the user is authenticated but lacks access, send them to their home
  if (userRole && ROLE_HOME[userRole]) {
    return <Navigate to={ROLE_HOME[userRole]} replace />;
  }

  // Role not yet determined
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <Alert className="max-w-md border-amber-200 bg-amber-50">
        <ShieldX className="h-4 w-4 text-amber-600" />
        <AlertDescription className="font-medium text-amber-800">
          Your account role is being determined. Please wait a moment.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RoleBasedRoute;
