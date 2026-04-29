
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
    queryKey: ["permissions", user?.id, userRole],
    queryFn: () => getUserPermissions(userRole),
    enabled: !!user,
  });

  const checkPermission = async (permissionName: string): Promise<boolean> => {
    if (!user || !userRole) return false;

    return hasPermission(userRole, permissionName as Permission);
  };

  const hasRolePermission = (permissionName: string): boolean => {
    if (!user || !userRole) return false;

    return hasPermission(userRole, permissionName as Permission);
  };

  return {
    permissions,
    isLoading,
    checkPermission,
    hasRolePermission,

    canViewUsers: () => hasRolePermission(PERMISSIONS.VIEW_USERS),
    canCreateUsers: () => hasRolePermission(PERMISSIONS.CREATE_USERS),
    canEditUsers: () => hasRolePermission(PERMISSIONS.EDIT_USERS),
    canDeleteUsers: () => hasRolePermission(PERMISSIONS.DELETE_USERS),
    canManageUserRoles: () => hasRolePermission(PERMISSIONS.MANAGE_USER_ROLES),
    canSuspendUsers: () => hasRolePermission(PERMISSIONS.SUSPEND_USERS),
    canResetPasswords: () => hasRolePermission(PERMISSIONS.RESET_USER_PASSWORDS),

    canViewRoles: () => hasRolePermission(PERMISSIONS.VIEW_ROLES),
    canCreateRoles: () => hasRolePermission(PERMISSIONS.CREATE_ROLES),
    canEditRoles: () => hasRolePermission(PERMISSIONS.EDIT_ROLES),
    canDeleteRoles: () => hasRolePermission(PERMISSIONS.DELETE_ROLES),
    canViewPermissions: () => hasRolePermission(PERMISSIONS.VIEW_PERMISSIONS),
    canManagePermissions: () => hasRolePermission(PERMISSIONS.ASSIGN_ROLE_PERMISSIONS),

    canViewAllChildren: () => hasRolePermission(PERMISSIONS.VIEW_ALL_CHILDREN),
    canViewOwnChildren: () => hasRolePermission(PERMISSIONS.VIEW_OWN_CHILDREN),
    canCreateChildren: () => hasRolePermission(PERMISSIONS.CREATE_CHILDREN),
    canEditChildren: () => hasRolePermission(PERMISSIONS.EDIT_CHILDREN),
    canDeleteChildren: () => hasRolePermission(PERMISSIONS.DELETE_CHILDREN),

    canViewClasses: () => hasRolePermission(PERMISSIONS.VIEW_CLASSES),
    canCreateClasses: () => hasRolePermission(PERMISSIONS.CREATE_CLASSES),
    canEditClasses: () => hasRolePermission(PERMISSIONS.EDIT_CLASSES),
    canDeleteClasses: () => hasRolePermission(PERMISSIONS.DELETE_CLASSES),
    canAssignTeachers: () => hasRolePermission(PERMISSIONS.ASSIGN_TEACHERS),

    canViewAttendance: () => hasRolePermission(PERMISSIONS.VIEW_ATTENDANCE),
    canCheckinChildren: () => hasRolePermission(PERMISSIONS.CHECKIN_CHILDREN),
    canCheckoutChildren: () => hasRolePermission(PERMISSIONS.CHECKOUT_CHILDREN),
    canManageAttendance: () => hasRolePermission(PERMISSIONS.MANAGE_ATTENDANCE),
    canViewAttendanceReports: () => hasRolePermission(PERMISSIONS.VIEW_ATTENDANCE_REPORTS),

    canViewOrgSettings: () => hasRolePermission(PERMISSIONS.VIEW_ORGANIZATION_SETTINGS),
    canEditOrgSettings: () => hasRolePermission(PERMISSIONS.EDIT_ORGANIZATION_SETTINGS),
    canManageOrgBranding: () => hasRolePermission(PERMISSIONS.MANAGE_ORGANIZATION_BRANDING),
    canViewAuditLogs: () => hasRolePermission(PERMISSIONS.VIEW_AUDIT_LOGS),

    canViewDevices: () => hasRolePermission(PERMISSIONS.VIEW_DEVICES),
    canRegisterDevices: () => hasRolePermission(PERMISSIONS.REGISTER_DEVICES),
    canEditDevices: () => hasRolePermission(PERMISSIONS.EDIT_DEVICES),
    canDeleteDevices: () => hasRolePermission(PERMISSIONS.DELETE_DEVICES),

    canManageSystemSettings: () => hasRolePermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    canViewSystemHealth: () => hasRolePermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageBackups: () => hasRolePermission(PERMISSIONS.MANAGE_BACKUPS),
    canManageIntegrations: () => hasRolePermission(PERMISSIONS.MANAGE_INTEGRATIONS),

    canSendMessages: () => hasRolePermission(PERMISSIONS.SEND_MESSAGES),
    canViewMessages: () => hasRolePermission(PERMISSIONS.VIEW_MESSAGES),
    canBroadcastMessages: () => hasRolePermission(PERMISSIONS.BROADCAST_MESSAGES),
  };
};

export const useRoleAccess = () => {
  const { user, userRole } = useAuth();

  const canAccessParent = userRole === 'parent';
  const canAccessAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canAccessStaff = ['staff', 'teacher', 'teacher_assistant'].includes(userRole || '');

  return {
    canAccessParent,
    canAccessAdmin,
    canAccessStaff,
  };
};

