
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/CleanAuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, AlertTriangle } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.warn(`Access denied for role ${userRole} to ${location.pathname}. Allowed roles:`, allowedRoles);
    
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-background">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <ShieldX className="h-4 w-4 text-red-600" />
          <AlertDescription className="font-medium text-red-800">
            Access denied. You don't have permission to view this page.
            <br />
            <span className="text-sm">Your role: {userRole}</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
