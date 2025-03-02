
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Log access attempt for debugging
  useEffect(() => {
    if (!isLoading) {
      console.log('Access check:', {
        path: location.pathname,
        user: user ? 'authenticated' : 'unauthenticated',
        userRole,
        allowedRoles,
        hasAccess: !allowedRoles.length || (userRole && allowedRoles.includes(userRole))
      });
    }
  }, [isLoading, user, userRole, allowedRoles, location.pathname]);

  if (isLoading) {
    // Show loading state while checking auth
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-2 text-gray-600">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    // Show toast notification for unauthorized access
    toast({
      title: "Authentication required",
      description: "Please log in to access this page",
      variant: "destructive"
    });
    
    // Redirect to login page if not authenticated
    return <Navigate to="/check-in-kiosk" state={{ from: location }} replace />;
  }

  // If there are allowed roles and the user's role is not in the list, redirect to unauthorized page
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    toast({
      title: "Access denied",
      description: `You need ${allowedRoles.join(' or ')} permissions to view this page`,
      variant: "destructive"
    });
    
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
