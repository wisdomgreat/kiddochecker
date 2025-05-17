
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/supabase';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useDashboardNavigation } from '@/hooks/use-dashboard-navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Save the current path for redirect after login
  useEffect(() => {
    if (!user && !isLoading) {
      sessionStorage.setItem("returnPath", location.pathname);
      console.log("Protected route: Saving return path:", location.pathname);
    }
  }, [user, isLoading, location.pathname]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <CircularProgress size="large" />
        <p className="mt-4 text-gray-600">Verifying your access...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("Protected route: No authenticated user, redirecting to login");
    toast({
      title: "Authentication required",
      description: "Please log in to access this page",
      variant: "destructive"
    });
    
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    console.log('Access denied for path:', location.pathname, 'User role:', userRole, 'Required roles:', allowedRoles);
    
    toast({
      title: "Access denied",
      description: `You don't have permission to access this page`,
      variant: "destructive"
    });
    
    // Determine where to redirect based on user's role
    let redirectPath = '/landing';
    
    if (userRole === 'admin' || userRole === 'super_admin') {
      redirectPath = '/admin-dashboard';
    } else if (userRole === 'teacher' || userRole === 'teacher_assistant' || userRole === 'staff') {
      redirectPath = '/teacher-dashboard';
    } else if (userRole === 'parent') {
      redirectPath = '/parent-dashboard';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has appropriate role
  return <>{children}</>;
};

export default ProtectedRoute;
