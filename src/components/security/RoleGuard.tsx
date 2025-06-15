
import { ReactNode } from 'react';
import { usePermissions, useRoleAccess } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  allowedRoles?: AppRole[];
  requireParentAccess?: boolean;
  requireAdminAccess?: boolean;
  fallback?: ReactNode;
}

const RoleGuard = ({ 
  children, 
  requiredPermission,
  allowedRoles,
  requireParentAccess,
  requireAdminAccess,
  fallback 
}: RoleGuardProps) => {
  const { userRole, loading } = useAuth();
  const { checkPermission } = usePermissions();
  const { canAccessParent, canAccessAdmin } = useRoleAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return fallback || <AccessDenied reason="insufficient_role" />;
  }

  // Check permission-based access
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return fallback || <AccessDenied reason="insufficient_permission" />;
  }

  // Check parent feature access
  if (requireParentAccess && !canAccessParent) {
    return fallback || <AccessDenied reason="parent_access_denied" />;
  }

  // Check admin feature access
  if (requireAdminAccess && !canAccessAdmin) {
    return fallback || <AccessDenied reason="admin_access_denied" />;
  }

  return <>{children}</>;
};

const AccessDenied = ({ reason }: { reason: string }) => {
  const getMessage = () => {
    switch (reason) {
      case 'insufficient_role':
        return 'Your account role does not have access to this feature.';
      case 'insufficient_permission':
        return 'You do not have the required permissions to access this feature.';
      case 'parent_access_denied':
        return 'This feature is only available to parent accounts. Admin accounts cannot access parent features for security reasons.';
      case 'admin_access_denied':
        return 'This feature requires administrative privileges.';
      default:
        return 'Access denied.';
    }
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Alert className="max-w-md">
        <ShieldX className="h-4 w-4" />
        <AlertDescription className="font-medium">
          {getMessage()}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RoleGuard;
