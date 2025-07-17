
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
  
  return {
    permissions,
    isLoading,
    checkPermission,
    // Enhanced convenience methods for granular permissions
    
    // User Management
    canViewUsers: () => hasPermission(PERMISSIONS.VIEW_USERS),
    canCreateUsers: () => hasPermission(PERMISSIONS.CREATE_USERS),
    canEditUsers: () => hasPermission(PERMISSIONS.EDIT_USERS),
    canDeleteUsers: () => hasPermission(PERMISSIONS.DELETE_USERS),
    canManageUserRoles: () => hasPermission(PERMISSIONS.MANAGE_USER_ROLES),
    canSuspendUsers: () => hasPermission(PERMISSIONS.SUSPEND_USERS),
    canResetPasswords: () => hasPermission(PERMISSIONS.RESET_USER_PASSWORDS),
    
    // Role & Permission Management
    canViewRoles: () => hasPermission(PERMISSIONS.VIEW_ROLES),
    canCreateRoles: () => hasPermission(PERMISSIONS.CREATE_ROLES),
    canEditRoles: () => hasPermission(PERMISSIONS.EDIT_ROLES),
    canDeleteRoles: () => hasPermission(PERMISSIONS.DELETE_ROLES),
    canViewPermissions: () => hasPermission(PERMISSIONS.VIEW_PERMISSIONS),
    canManagePermissions: () => hasPermission(PERMISSIONS.ASSIGN_ROLE_PERMISSIONS),
    
    // Children Management
    canViewAllChildren: () => hasPermission(PERMISSIONS.VIEW_ALL_CHILDREN),
    canViewOwnChildren: () => hasPermission(PERMISSIONS.VIEW_OWN_CHILDREN),
    canCreateChildren: () => hasPermission(PERMISSIONS.CREATE_CHILDREN),
    canEditChildren: () => hasPermission(PERMISSIONS.EDIT_CHILDREN),
    canDeleteChildren: () => hasPermission(PERMISSIONS.DELETE_CHILDREN),
    
    // Class Management
    canViewClasses: () => hasPermission(PERMISSIONS.VIEW_CLASSES),
    canCreateClasses: () => hasPermission(PERMISSIONS.CREATE_CLASSES),
    canEditClasses: () => hasPermission(PERMISSIONS.EDIT_CLASSES),
    canDeleteClasses: () => hasPermission(PERMISSIONS.DELETE_CLASSES),
    canAssignTeachers: () => hasPermission(PERMISSIONS.ASSIGN_TEACHERS),
    
    // Attendance Management
    canViewAttendance: () => hasPermission(PERMISSIONS.VIEW_ATTENDANCE),
    canCheckinChildren: () => hasPermission(PERMISSIONS.CHECKIN_CHILDREN),
    canCheckoutChildren: () => hasPermission(PERMISSIONS.CHECKOUT_CHILDREN),
    canManageAttendance: () => hasPermission(PERMISSIONS.MANAGE_ATTENDANCE),
    canViewAttendanceReports: () => hasPermission(PERMISSIONS.VIEW_ATTENDANCE_REPORTS),
    
    // Organization Management
    canViewOrgSettings: () => hasPermission(PERMISSIONS.VIEW_ORGANIZATION_SETTINGS),
    canEditOrgSettings: () => hasPermission(PERMISSIONS.EDIT_ORGANIZATION_SETTINGS),
    canManageOrgBranding: () => hasPermission(PERMISSIONS.MANAGE_ORGANIZATION_BRANDING),
    canViewAuditLogs: () => hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS),
    
    // Device Management
    canViewDevices: () => hasPermission(PERMISSIONS.VIEW_DEVICES),
    canRegisterDevices: () => hasPermission(PERMISSIONS.REGISTER_DEVICES),
    canEditDevices: () => hasPermission(PERMISSIONS.EDIT_DEVICES),
    canDeleteDevices: () => hasPermission(PERMISSIONS.DELETE_DEVICES),
    
    // System Administration
    canManageSystemSettings: () => hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    canViewSystemHealth: () => hasPermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageBackups: () => hasPermission(PERMISSIONS.MANAGE_BACKUPS),
    canManageIntegrations: () => hasPermission(PERMISSIONS.MANAGE_INTEGRATIONS),
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
