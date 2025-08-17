
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

  // Check if user has required role access
  const hasAccess = () => {
    if (!userRole) return false;
    
    // Super admin always has access (but we need to handle it carefully since it might not be in AppRole type)
    if (userRole === 'super_admin' as any) return true;
    
    // Check if user's role is in allowed roles
    return allowedRoles.includes(userRole);
  };

  // If user has access, show content
  if (hasAccess()) {
    return <>{children}</>;
  }

  // If redirectTo is specified, redirect there
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Default behavior - navigate to appropriate dashboard based on role
  if (userRole) {
    // Handle super_admin case
    if (userRole === 'super_admin' as any) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    
    switch (userRole) {
      case 'admin':
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
