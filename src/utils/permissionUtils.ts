export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_USER_ROLES: 'manage_user_roles',
  SUSPEND_USERS: 'suspend_users',
  RESET_USER_PASSWORDS: 'reset_user_passwords',
  
  // Role & Permission Management
  VIEW_ROLES: 'view_roles',
  CREATE_ROLES: 'create_roles',
  EDIT_ROLES: 'edit_roles',
  DELETE_ROLES: 'delete_roles',
  VIEW_PERMISSIONS: 'view_permissions',
  ASSIGN_ROLE_PERMISSIONS: 'assign_role_permissions',
  
  // Children Management
  VIEW_ALL_CHILDREN: 'view_all_children',
  VIEW_OWN_CHILDREN: 'view_own_children',
  CREATE_CHILDREN: 'create_children',
  EDIT_CHILDREN: 'edit_children',
  DELETE_CHILDREN: 'delete_children',
  
  // Class Management
  VIEW_CLASSES: 'view_classes',
  CREATE_CLASSES: 'create_classes',
  EDIT_CLASSES: 'edit_classes',
  DELETE_CLASSES: 'delete_classes',
  ASSIGN_TEACHERS: 'assign_teachers',
  
  // Attendance Management
  VIEW_ATTENDANCE: 'view_attendance',
  CHECKIN_CHILDREN: 'checkin_children',
  CHECKOUT_CHILDREN: 'checkout_children',
  MANAGE_ATTENDANCE: 'manage_attendance',
  VIEW_ATTENDANCE_REPORTS: 'view_attendance_reports',
  
  // Organization Management
  VIEW_ORGANIZATION_SETTINGS: 'view_organization_settings',
  EDIT_ORGANIZATION_SETTINGS: 'edit_organization_settings',
  MANAGE_ORGANIZATION_BRANDING: 'manage_organization_branding',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Device Management
  VIEW_DEVICES: 'view_devices',
  REGISTER_DEVICES: 'register_devices',
  EDIT_DEVICES: 'edit_devices',
  DELETE_DEVICES: 'delete_devices',
  
  // System Administration
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_SYSTEM_HEALTH: 'view_system_health',
  MANAGE_BACKUPS: 'manage_backups',
  MANAGE_INTEGRATIONS: 'manage_integrations',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const hasPermission = (permissionName: string): boolean => {
  // This would typically check against user's actual permissions
  // For now, we'll implement basic role-based checks
  return true; // Placeholder - will be enhanced with proper permission checking
};

export const getUserPermissions = async (): Promise<Permission[]> => {
  // This would fetch user's actual permissions from the database
  // For now, return all permissions for super admins
  return Object.values(PERMISSIONS);
};

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY = {
  'super_admin': ['admin', 'staff', 'teacher', 'teacher_assistant', 'parent'],
  'admin': ['staff', 'teacher', 'teacher_assistant'],
  'staff': ['teacher', 'teacher_assistant'],
  'teacher': [],
  'teacher_assistant': [],
  'parent': []
} as const;

export const hasRoleOrHigher = (userRole: string, requiredRole: string): boolean => {
  if (userRole === requiredRole) return true;
  
  const hierarchy = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
  return hierarchy?.includes(requiredRole as any) || false;
};
