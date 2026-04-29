
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, userRole, loading, refreshUserRole } = useAuth();
  const location = useLocation();
  const [waitingForRole, setWaitingForRole] = useState(false);

  // If user exists but role is null, give it a brief window then stop waiting
  useEffect(() => {
    if (user && !userRole && !loading) {
      setWaitingForRole(true);
      // Try one more role refresh
      refreshUserRole();
      const timeout = setTimeout(() => {
        setWaitingForRole(false);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setWaitingForRole(false);
    }
  }, [user, userRole, loading, refreshUserRole]);

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



  // Check role-based access if roles are specified
  if (allowedRoles && user) {
    // If role is still loading, show brief loader (max 3s)
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

    // If role is definitively null after waiting, show error with action
    if (!userRole) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-slate-50/50">
          <div className="w-full max-w-md space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Account Setup Needed</h2>
            <p className="text-slate-600">
              We couldn't determine your account permissions. This may mean your account hasn't been fully set up yet.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => refreshUserRole()}
                className="gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="gap-2"
              >
                Re-Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const hasPermission = userRole === 'super_admin' || allowedRoles.includes(userRole);
    
    if (!hasPermission) {
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
