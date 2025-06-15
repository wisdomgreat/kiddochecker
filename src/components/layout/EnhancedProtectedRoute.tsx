
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRoleAccess } from '@/hooks/usePermissions';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, AlertTriangle } from 'lucide-react';

interface EnhancedProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: string;
  requireParentAccess?: boolean;
  requireAdminAccess?: boolean;
}

const EnhancedProtectedRoute = ({ 
  children, 
  allowedRoles,
  requiredPermission,
  requireParentAccess,
  requireAdminAccess
}: EnhancedProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const { canAccessParent, canAccessAdmin } = useRoleAccess();
  const location = useLocation();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    console.info("Access denied for path:", location.pathname, "User role:", userRole, "Required roles:", allowedRoles);
    return <Navigate to="/access-denied" replace />;
  }

  // Check parent feature access
  if (requireParentAccess && !canAccessParent) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Alert className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertDescription className="font-medium">
            This feature is only available to parent accounts. Admin accounts cannot access parent features for security reasons.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check admin feature access
  if (requireAdminAccess && !canAccessAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            This feature requires administrative privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default EnhancedProtectedRoute;
