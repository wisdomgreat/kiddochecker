
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { 
  hasPermission, 
  canAccessParentFeatures, 
  canAccessAdminFeatures,
  getUserPermissions,
  hasRoleLevel,
  Permission,
  PERMISSIONS
} from "@/utils/permissionUtils";

export const usePermissions = () => {
  const { user, userRole } = useAuth();
  
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["permissions", user?.id],
    queryFn: getUserPermissions,
    enabled: !!user,
  });
  
  const checkPermission = (permissionName: string): boolean => {
    if (!user || !userRole) return false;
    
    // Super admin has all permissions
    if (userRole === 'super_admin') return true;
    
    return permissions.some(p => p.name === permissionName);
  };
  
  return {
    permissions,
    isLoading,
    checkPermission,
    // Convenience methods for common checks
    canViewUsers: checkPermission(PERMISSIONS.VIEW_USERS),
    canManageUsers: checkPermission(PERMISSIONS.EDIT_USERS),
    canViewChildren: checkPermission(PERMISSIONS.VIEW_CHILDREN),
    canManageChildren: checkPermission(PERMISSIONS.EDIT_CHILDREN),
    canViewClasses: checkPermission(PERMISSIONS.VIEW_CLASSES),
    canManageClasses: checkPermission(PERMISSIONS.EDIT_CLASSES),
    canViewReports: checkPermission(PERMISSIONS.VIEW_REPORTS),
    canManageOrganization: checkPermission(PERMISSIONS.MANAGE_ORGANIZATION),
    canViewAuditLogs: checkPermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  };
};

export const useRoleAccess = () => {
  const { user, userRole } = useAuth();
  
  // Simplified role access checks based on userRole
  const canAccessParent = userRole === 'parent';
  const canAccessAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  return {
    canAccessParent,
    canAccessAdmin,
  };
};

export const useRoleLevel = (requiredLevel: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["roleLevel", user?.id, requiredLevel],
    queryFn: () => hasRoleLevel(requiredLevel),
    enabled: !!user,
  });
};
