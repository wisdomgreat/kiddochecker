
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requireParentAccess?: boolean;
  requireStaffAccess?: boolean;
  requireAdminAccess?: boolean;
}

const RoleGuard = ({ 
  children, 
  requireParentAccess,
  requireStaffAccess,
  requireAdminAccess
}: RoleGuardProps) => {
  const { user, userRole, loading } = useAuth();
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

  // Check parent access
  if (requireParentAccess && userRole !== 'parent') {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Alert className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertDescription className="font-medium">
            This feature is only available to parent accounts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check staff access (includes staff, teacher, teacher_assistant)
  if (requireStaffAccess && !['staff', 'teacher', 'teacher_assistant'].includes(userRole || '')) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Alert className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertDescription className="font-medium">
            This feature is only available to staff members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check admin access
  if (requireAdminAccess && !['admin', 'super_admin'].includes(userRole || '')) {
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

export default RoleGuard;

