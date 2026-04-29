
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  requireAuth = true,
  fallbackPath = '/login'
}: ProtectedRouteProps) => {
  const { user, userRole, loading, isMfaPending } = useAuth();
  const location = useLocation();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // MFA Enforcement: If MFA is pending (aal1), force completion at /login
  if (user && isMfaPending && userRole !== 'kiosk') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && user) {
    if (!userRole) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <Alert className="max-w-md border-amber-200 bg-amber-50">
            <ShieldX className="h-4 w-4 text-amber-600" />
            <AlertDescription className="font-medium text-amber-800">
              Your account role is being determined. Please wait a moment and refresh the page.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    const hasPermission = userRole === 'super_admin' || allowedRoles.includes(userRole);
    
    if (!hasPermission) {
      console.info("Access denied for path:", location.pathname, "User role:", userRole, "Required roles:", allowedRoles);
      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <ShieldX className="h-4 w-4 text-red-600" />
            <AlertDescription className="font-medium text-red-800">
              Access denied. You don't have permission to view this page.
              <br />
              <span className="text-sm">Your role: {userRole}</span>
              <br />
              <span className="text-sm">Required: {allowedRoles.join(', ')}</span>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

