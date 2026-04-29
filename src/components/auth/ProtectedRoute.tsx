
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
        <div className="flex items-center justify-center min-h-screen p-8 bg-slate-50/50">
          <div className="w-full max-w-md space-y-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Setting up your session</h2>
            <p className="text-slate-600">
              We're determining your account permissions. This usually takes just a second.
            </p>
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Refresh Page
              </Button>
            </div>
          </div>
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

