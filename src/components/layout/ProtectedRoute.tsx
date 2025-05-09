
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, userRole, isLoading, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  // Save the current path for redirect after login
  useEffect(() => {
    if (!user && !isLoading) {
      sessionStorage.setItem("returnPath", location.pathname);
      console.log("Protected route: Saving return path:", location.pathname);
    }
  }, [user, isLoading, location.pathname]);

  // Refresh session and verify authentication when the component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isLoading) return;
        
        if (!user) {
          console.log("Protected route: No user detected, refreshing session");
          await refreshSession();
        }
        
        setIsVerifying(false);
      } catch (error) {
        console.error("Failed to verify authentication:", error);
        setIsVerifying(false);
      }
    };
    
    checkAuth();
  }, [isLoading, user, refreshSession]);

  // Debug logging
  useEffect(() => {
    if (!isLoading && !isVerifying) {
      console.log('ProtectedRoute access check:', {
        path: location.pathname,
        user: user ? 'authenticated' : 'unauthenticated',
        userRole,
        allowedRoles,
        hasAccess: !allowedRoles.length || (userRole && allowedRoles.includes(userRole))
      });
    }
  }, [isLoading, isVerifying, user, userRole, allowedRoles, location.pathname]);

  // Show loading state while checking auth
  if (isLoading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-2 text-gray-600">Verifying access...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("Protected route: No authenticated user, redirecting to login");
    // Show toast notification for unauthorized access
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
      description: `You need ${allowedRoles.join(' or ')} permissions to view this page`,
      variant: "destructive"
    });
    
    // Determine where to redirect based on user's role
    let redirectPath = '/unauthorized';
    
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
