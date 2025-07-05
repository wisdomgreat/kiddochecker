
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireParentAccess?: boolean;
  requireAdminAccess?: boolean;
  fallback?: ReactNode;
}

const RoleGuard = ({ 
  children, 
  allowedRoles,
  requireParentAccess,
  requireAdminAccess,
  fallback 
}: RoleGuardProps) => {
  const { userRole, loading } = useAuth();

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

  // STRICT: Check parent feature access - Admin users are explicitly blocked
  if (requireParentAccess) {
    if (userRole === 'admin' || userRole === 'super_admin') {
      return fallback || <AccessDenied reason="admin_blocked_from_parent" />;
    }
    
    if (userRole !== 'parent') {
      return fallback || <AccessDenied reason="parent_access_denied" />;
    }
  }

  // Check admin feature access
  if (requireAdminAccess && userRole !== 'admin' && userRole !== 'super_admin') {
    return fallback || <AccessDenied reason="admin_access_denied" />;
  }

  return <>{children}</>;
};

const AccessDenied = ({ reason }: { reason: string }) => {
  const getMessage = () => {
    switch (reason) {
      case 'insufficient_role':
        return 'Your account role does not have access to this feature.';
      case 'admin_blocked_from_parent':
        return 'Admin accounts cannot access parent features for security reasons. Admin users are restricted to administrative functions only.';
      case 'parent_access_denied':
        return 'This feature is only available to parent accounts.';
      case 'admin_access_denied':
        return 'This feature requires administrative privileges.';
      default:
        return 'Access denied.';
    }
  };

  const getIcon = () => {
    if (reason === 'admin_blocked_from_parent') {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
    return <ShieldX className="h-4 w-4" />;
  };

  const getAlertClass = () => {
    if (reason === 'admin_blocked_from_parent') {
      return "max-w-md border-amber-200 bg-amber-50";
    }
    return "max-w-md";
  };

  const getTextClass = () => {
    if (reason === 'admin_blocked_from_parent') {
      return "font-medium text-amber-800";
    }
    return "font-medium";
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Alert className={getAlertClass()}>
        {getIcon()}
        <AlertDescription className={getTextClass()}>
          {getMessage()}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RoleGuard;
