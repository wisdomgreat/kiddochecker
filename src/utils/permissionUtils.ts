
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

  // Messaging
  SEND_MESSAGES: 'send_messages',
  VIEW_MESSAGES: 'view_messages',
  BROADCAST_MESSAGES: 'broadcast_messages',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'super_admin': Object.values(PERMISSIONS) as Permission[],
  'admin': [
    PERMISSIONS.VIEW_USERS, PERMISSIONS.CREATE_USERS, PERMISSIONS.EDIT_USERS,
    PERMISSIONS.VIEW_ROLES, PERMISSIONS.VIEW_PERMISSIONS,
    PERMISSIONS.VIEW_ALL_CHILDREN, PERMISSIONS.CREATE_CHILDREN, PERMISSIONS.EDIT_CHILDREN,
    PERMISSIONS.VIEW_CLASSES, PERMISSIONS.CREATE_CLASSES, PERMISSIONS.EDIT_CLASSES, PERMISSIONS.ASSIGN_TEACHERS,
    PERMISSIONS.VIEW_ATTENDANCE, PERMISSIONS.CHECKIN_CHILDREN, PERMISSIONS.CHECKOUT_CHILDREN, PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.VIEW_DEVICES, PERMISSIONS.REGISTER_DEVICES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES, PERMISSIONS.BROADCAST_MESSAGES
  ],
  'staff': [
    PERMISSIONS.VIEW_ALL_CHILDREN, PERMISSIONS.EDIT_CHILDREN,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_ATTENDANCE, PERMISSIONS.CHECKIN_CHILDREN, PERMISSIONS.CHECKOUT_CHILDREN, PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES, PERMISSIONS.BROADCAST_MESSAGES
  ],
  'teacher': [
    PERMISSIONS.VIEW_ALL_CHILDREN,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_ATTENDANCE, PERMISSIONS.CHECKIN_CHILDREN, PERMISSIONS.CHECKOUT_CHILDREN,
    PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
  ],
  'teacher_assistant': [
    PERMISSIONS.VIEW_ALL_CHILDREN,
    PERMISSIONS.VIEW_ATTENDANCE, PERMISSIONS.CHECKIN_CHILDREN,
    PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
  ],
  'parent': [
    PERMISSIONS.VIEW_OWN_CHILDREN,
    PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
  ]
};

/**
 * Checks if a specific role has a given permission.
 * Includes inheritance from ROLE_HIERARCHY.
 */
export const hasPermission = (userRole: string | null, permission: Permission): boolean => {
  if (!userRole) return false;

  // Direct check
  if (ROLE_PERMISSIONS[userRole]?.includes(permission)) return true;

  // Inheritance check
  const inheritedRoles = ROLE_HIERARCHY[userRole] || [];
  return inheritedRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
};

export const getUserPermissions = (userRole: string | null): Permission[] => {
  if (!userRole) return [];

  const basePermissions = ROLE_PERMISSIONS[userRole] || [];
  const inheritedRoles = ROLE_HIERARCHY[userRole] || [];

  const inheritedPermissions = inheritedRoles.flatMap(role => ROLE_PERMISSIONS[role] || []);

  // Return unique permissions
  return Array.from(new Set([...basePermissions, ...inheritedPermissions]));
};

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<string, string[]> = {
  'super_admin': ['admin', 'staff', 'teacher', 'teacher_assistant', 'parent'],
  'admin': ['staff', 'teacher', 'teacher_assistant'],
  'staff': ['teacher', 'teacher_assistant'],
  'teacher': [],
  'teacher_assistant': [],
  'parent': []
};

export const hasRoleOrHigher = (userRole: string, requiredRole: string): boolean => {
  if (userRole === requiredRole) return true;

  const hierarchy = ROLE_HIERARCHY[userRole];
  if (!hierarchy) return false;

  return hierarchy.includes(requiredRole);
};


