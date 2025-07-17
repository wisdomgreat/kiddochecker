
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { 
  hasPermission, 
  getUserPermissions,
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
  
  const checkPermission = async (permissionName: string): Promise<boolean> => {
    if (!user || !userRole) return false;
    
    // Super admin has all permissions
    if (userRole === 'super_admin') return true;
    
    return hasPermission(permissionName);
  };
  
  // Helper function for synchronous permission checks based on role
  const hasRolePermission = (permissionName: string): boolean => {
    if (!user || !userRole) return false;
    
    // Super admin has all permissions
    if (userRole === 'super_admin') return true;
    
    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'admin': [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_USERS,
        PERMISSIONS.EDIT_USERS,
        PERMISSIONS.DELETE_USERS,
        PERMISSIONS.MANAGE_USER_ROLES,
        PERMISSIONS.VIEW_ALL_CHILDREN,
        PERMISSIONS.CREATE_CHILDREN,
        PERMISSIONS.EDIT_CHILDREN,
        PERMISSIONS.DELETE_CHILDREN,
        PERMISSIONS.VIEW_CLASSES,
        PERMISSIONS.CREATE_CLASSES,
        PERMISSIONS.EDIT_CLASSES,
        PERMISSIONS.DELETE_CLASSES,
        PERMISSIONS.VIEW_ATTENDANCE,
        PERMISSIONS.MANAGE_ATTENDANCE,
        PERMISSIONS.VIEW_ORGANIZATION_SETTINGS,
        PERMISSIONS.EDIT_ORGANIZATION_SETTINGS,
        PERMISSIONS.VIEW_AUDIT_LOGS,
        PERMISSIONS.VIEW_SYSTEM_HEALTH,
        PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
      ],
      'staff': [
        PERMISSIONS.VIEW_ALL_CHILDREN,
        PERMISSIONS.CREATE_CHILDREN,
        PERMISSIONS.EDIT_CHILDREN,
        PERMISSIONS.VIEW_CLASSES,
        PERMISSIONS.VIEW_ATTENDANCE,
        PERMISSIONS.CHECKIN_CHILDREN,
        PERMISSIONS.CHECKOUT_CHILDREN,
        PERMISSIONS.MANAGE_ATTENDANCE,
      ],
      'teacher': [
        PERMISSIONS.VIEW_ALL_CHILDREN,
        PERMISSIONS.VIEW_CLASSES,
        PERMISSIONS.VIEW_ATTENDANCE,
        PERMISSIONS.CHECKIN_CHILDREN,
        PERMISSIONS.CHECKOUT_CHILDREN,
      ],
      'teacher_assistant': [
        PERMISSIONS.VIEW_ALL_CHILDREN,
        PERMISSIONS.VIEW_CLASSES,
        PERMISSIONS.VIEW_ATTENDANCE,
        PERMISSIONS.CHECKIN_CHILDREN,
        PERMISSIONS.CHECKOUT_CHILDREN,
      ],
      'parent': [
        PERMISSIONS.VIEW_OWN_CHILDREN,
        PERMISSIONS.CREATE_CHILDREN,
        PERMISSIONS.EDIT_CHILDREN,
      ],
    };
    
    const userPermissions = rolePermissions[userRole] || [];
    return userPermissions.includes(permissionName);
  };
  
  return {
    permissions,
    isLoading,
    checkPermission,
    hasRolePermission,
    
    // User Management
    canViewUsers: () => hasRolePermission(PERMISSIONS.VIEW_USERS),
    canCreateUsers: () => hasRolePermission(PERMISSIONS.CREATE_USERS),
    canEditUsers: () => hasRolePermission(PERMISSIONS.EDIT_USERS),
    canDeleteUsers: () => hasRolePermission(PERMISSIONS.DELETE_USERS),
    canManageUserRoles: () => hasRolePermission(PERMISSIONS.MANAGE_USER_ROLES),
    canSuspendUsers: () => hasRolePermission(PERMISSIONS.SUSPEND_USERS),
    canResetPasswords: () => hasRolePermission(PERMISSIONS.RESET_USER_PASSWORDS),
    
    // Role & Permission Management
    canViewRoles: () => hasRolePermission(PERMISSIONS.VIEW_ROLES),
    canCreateRoles: () => hasRolePermission(PERMISSIONS.CREATE_ROLES),
    canEditRoles: () => hasRolePermission(PERMISSIONS.EDIT_ROLES),
    canDeleteRoles: () => hasRolePermission(PERMISSIONS.DELETE_ROLES),
    canViewPermissions: () => hasRolePermission(PERMISSIONS.VIEW_PERMISSIONS),
    canManagePermissions: () => hasRolePermission(PERMISSIONS.ASSIGN_ROLE_PERMISSIONS),
    
    // Children Management
    canViewAllChildren: () => hasRolePermission(PERMISSIONS.VIEW_ALL_CHILDREN),
    canViewOwnChildren: () => hasRolePermission(PERMISSIONS.VIEW_OWN_CHILDREN),
    canCreateChildren: () => hasRolePermission(PERMISSIONS.CREATE_CHILDREN),
    canEditChildren: () => hasRolePermission(PERMISSIONS.EDIT_CHILDREN),
    canDeleteChildren: () => hasRolePermission(PERMISSIONS.DELETE_CHILDREN),
    
    // Class Management
    canViewClasses: () => hasRolePermission(PERMISSIONS.VIEW_CLASSES),
    canCreateClasses: () => hasRolePermission(PERMISSIONS.CREATE_CLASSES),
    canEditClasses: () => hasRolePermission(PERMISSIONS.EDIT_CLASSES),
    canDeleteClasses: () => hasRolePermission(PERMISSIONS.DELETE_CLASSES),
    canAssignTeachers: () => hasRolePermission(PERMISSIONS.ASSIGN_TEACHERS),
    
    // Attendance Management
    canViewAttendance: () => hasRolePermission(PERMISSIONS.VIEW_ATTENDANCE),
    canCheckinChildren: () => hasRolePermission(PERMISSIONS.CHECKIN_CHILDREN),
    canCheckoutChildren: () => hasRolePermission(PERMISSIONS.CHECKOUT_CHILDREN),
    canManageAttendance: () => hasRolePermission(PERMISSIONS.MANAGE_ATTENDANCE),
    canViewAttendanceReports: () => hasRolePermission(PERMISSIONS.VIEW_ATTENDANCE_REPORTS),
    
    // Organization Management
    canViewOrgSettings: () => hasRolePermission(PERMISSIONS.VIEW_ORGANIZATION_SETTINGS),
    canEditOrgSettings: () => hasRolePermission(PERMISSIONS.EDIT_ORGANIZATION_SETTINGS),
    canManageOrgBranding: () => hasRolePermission(PERMISSIONS.MANAGE_ORGANIZATION_BRANDING),
    canViewAuditLogs: () => hasRolePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
    
    // Device Management
    canViewDevices: () => hasRolePermission(PERMISSIONS.VIEW_DEVICES),
    canRegisterDevices: () => hasRolePermission(PERMISSIONS.REGISTER_DEVICES),
    canEditDevices: () => hasRolePermission(PERMISSIONS.EDIT_DEVICES),
    canDeleteDevices: () => hasRolePermission(PERMISSIONS.DELETE_DEVICES),
    
    // System Administration
    canManageSystemSettings: () => hasRolePermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    canViewSystemHealth: () => hasRolePermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageBackups: () => hasRolePermission(PERMISSIONS.MANAGE_BACKUPS),
    canManageIntegrations: () => hasRolePermission(PERMISSIONS.MANAGE_INTEGRATIONS),
  };
};

export const useRoleAccess = () => {
  const { user, userRole } = useAuth();
  
  // Enhanced role access checks
  const canAccessParent = userRole === 'parent';
  const canAccessAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canAccessStaff = ['staff', 'teacher', 'teacher_assistant'].includes(userRole || '');
  
  return {
    canAccessParent,
    canAccessAdmin,
    canAccessStaff,
  };
};
