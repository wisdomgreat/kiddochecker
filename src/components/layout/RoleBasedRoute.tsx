
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

const RoleBasedRoute = ({ children, allowedRoles, redirectTo }: RoleBasedRouteProps) => {
  const { user, userRole, loading } = useAuth();
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

  // If user has a role and it's in allowed roles, show content
  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  // Super admin always has access
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // If redirectTo is specified, redirect there
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Default behavior - navigate to appropriate dashboard based on role
  if (userRole) {
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'staff':
      case 'teacher':
      case 'teacher_assistant':
        return <Navigate to="/staff-dashboard" replace />;
      case 'parent':
        return <Navigate to="/parent-dashboard" replace />;
      default:
        return <Navigate to="/parent-dashboard" replace />;
    }
  }

  // If no role is determined yet, show loading
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
