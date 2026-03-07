/**
 * Canonical React Query keys for the entire application.
 * Using an object ensures consistent, typo-safe query keys across
 * all hooks and prevents stale-cache issues from inconsistent strings.
 */
export const QUERY_KEYS = {
  // Auth & Users
  CURRENT_USER: ['current-user'] as const,
  USER_ROLE: (userId: string) => ['user-role', userId] as const,

  // Staff
  STAFF: ['staff'] as const,
  STAFF_INVITATIONS: ['staff-invitations'] as const,
  STAFF_VERIFICATION: ['staff-verification'] as const,

  // Admin Users (Edge Function)
  ADMIN_USERS: ['admin-users'] as const,

  // Children
  CHILDREN: (userId?: string) => userId ? ['children', userId] : ['children'] as const,
  CHILD_MEDICAL: (childId: string) => ['child-medical', childId] as const,

  // Classes
  CLASSES: ['classes'] as const,
  CLASS_TEACHERS: (classId: string) => ['class-teachers', classId] as const,

  // Attendance
  ATTENDANCE: ['attendance'] as const,
  PRESENT_CHILDREN: ['present-children'] as const,
  ATTENDANCE_HISTORY: (childId: string) => ['attendance-history', childId] as const,

  // QR Codes
  QR_CODES: ['qr-codes'] as const,
  QR_CODE: (childId: string) => ['qr-code', childId] as const,

  // Messages
  MESSAGES: ['messages'] as const,
  MESSAGE_THREAD: (userId: string) => ['message-thread', userId] as const,

  // Organization
  ORG_SETTINGS: ['org-settings'] as const,

  // Devices
  DEVICES: ['devices'] as const,

  // Reports
  REPORTS: ['reports'] as const,
  ADVANCED_REPORTS: ['advanced-reports'] as const,

  // Dashboard
  DASHBOARD_DATA: ['dashboard-data'] as const,

  // Events / Calendar
  EVENTS: ['events'] as const,

  // Audit Logs
  AUDIT_LOGS: ['audit-logs'] as const,

  // Permissions
  PERMISSIONS: (userId?: string, role?: string) =>
    userId ? ['permissions', userId, role] : ['permissions'] as const,
} as const;
