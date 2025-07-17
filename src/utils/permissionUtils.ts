
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced permission system with granular controls
 */

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  timestamp: string;
}

/**
 * Check if current user has a specific permission using role-based access
 */
export const hasPermission = async (permissionName: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Get user role first
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (roleError || !userRole) {
      console.error("Error fetching user role:", roleError);
      return false;
    }
    
    // Super admin has all permissions
    if (userRole.is_super_admin) return true;
    
    // Basic role-based permission check
    const rolePermissions = getRolePermissions(userRole.role);
    return rolePermissions.includes(permissionName);
    
  } catch (error) {
    console.error("Exception checking permission:", error);
    return false;
  }
};

/**
 * Get permissions for a specific role
 */
const getRolePermissions = (role: string): string[] => {
  const rolePermissionMap: Record<string, string[]> = {
    'super_admin': Object.values(PERMISSIONS),
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
    'parent': [
      PERMISSIONS.VIEW_OWN_CHILDREN,
      PERMISSIONS.CREATE_CHILDREN,
      PERMISSIONS.EDIT_CHILDREN,
    ],
  };
  
  return rolePermissionMap[role] || [];
};

/**
 * Get user's permissions with the current system
 */
export const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (roleError || !userRole) {
      console.error("Error fetching user role:", roleError);
      return [];
    }
    
    const userPermissionNames = getRolePermissions(userRole.role);
    
    // Convert permission names to Permission objects
    return userPermissionNames.map(name => ({
      id: name,
      name,
      resource: name.split('_')[0] || 'unknown',
      action: name.split('_').slice(1).join('_') || 'unknown',
      description: `Permission to ${name.replace(/_/g, ' ').toLowerCase()}`
    }));
    
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
};

/**
 * Admin function to manage users (simplified version)
 */
export const adminManageUser = async (
  action: string,
  targetUserId: string,
  data: any = {}
): Promise<{ success: boolean; error?: string; result?: any }> => {
  try {
    // Check if current user has admin permissions
    const canManage = await hasPermission(PERMISSIONS.MANAGE_USER_ROLES);
    if (!canManage) {
      return { success: false, error: "Insufficient permissions" };
    }

    switch (action) {
      case 'update_role':
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ 
            role: data.role,
            is_super_admin: data.is_super_admin || false 
          })
          .eq('user_id', targetUserId);
        
        if (updateError) {
          return { success: false, error: updateError.message };
        }
        break;
        
      case 'suspend':
        // In a real implementation, you might update a status field
        console.log(`Suspending user ${targetUserId}`);
        break;
        
      case 'delete':
        // In a real implementation, you might soft delete or archive
        console.log(`Deleting user ${targetUserId}`);
        break;
        
      default:
        return { success: false, error: "Unknown action" };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Exception in admin user management:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin dashboard statistics (mock data for now)
 */
export const getAdminDashboardStats = async () => {
  try {
    // Check permissions
    const canView = await hasPermission(PERMISSIONS.VIEW_ORGANIZATION_SETTINGS);
    if (!canView) {
      return { error: "Insufficient permissions" };
    }

    // Get real data from existing tables
    const [usersResult, childrenResult, classesResult, attendanceResult] = await Promise.all([
      supabase.from('user_roles').select('user_id, role').limit(1000),
      supabase.from('children').select('id').limit(1000),
      supabase.from('classes').select('id').limit(1000),
      supabase.from('attendance').select('id').eq('attendance_date', new Date().toISOString().split('T')[0])
    ]);

    const stats = {
      total_users: usersResult.data?.length || 0,
      active_users: usersResult.data?.length || 0,
      total_children: childrenResult.data?.length || 0,
      total_classes: classesResult.data?.length || 0,
      todays_attendance: attendanceResult.data?.length || 0,
      pending_checkouts: attendanceResult.data?.filter(a => !a.checked_out_at)?.length || 0,
      user_roles_breakdown: usersResult.data?.reduce((acc: Record<string, number>, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {},
      recent_activity: [
        { date: new Date().toISOString().split('T')[0], checkins: 15, checkouts: 12 },
        { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], checkins: 18, checkouts: 16 },
        { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], checkins: 20, checkouts: 19 },
      ]
    };

    return stats;
  } catch (error) {
    console.error("Exception fetching admin dashboard stats:", error);
    return null;
  }
};

/**
 * Log audit event (simplified version)
 */
export const logAuditEvent = async (
  action: string,
  resource: string,
  resourceId?: string,
  details?: any
): Promise<void> => {
  try {
    console.log("Audit Log:", {
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, you would save this to an audit_logs table
    // For now, we just log to console
  } catch (error) {
    console.error("Exception logging audit event:", error);
  }
};

/**
 * Enhanced permission constants with granular controls
 */
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
  CREATE_PERMISSIONS: 'create_permissions',
  EDIT_PERMISSIONS: 'edit_permissions',
  DELETE_PERMISSIONS: 'delete_permissions',
  ASSIGN_ROLE_PERMISSIONS: 'assign_role_permissions',
  
  // Children Management
  VIEW_ALL_CHILDREN: 'view_all_children',
  VIEW_OWN_CHILDREN: 'view_own_children',
  CREATE_CHILDREN: 'create_children',
  EDIT_CHILDREN: 'edit_children',
  DELETE_CHILDREN: 'delete_children',
  MANAGE_CHILD_ASSIGNMENTS: 'manage_child_assignments',
  
  // Class Management
  VIEW_CLASSES: 'view_classes',
  CREATE_CLASSES: 'create_classes',
  EDIT_CLASSES: 'edit_classes',
  DELETE_CLASSES: 'delete_classes',
  ASSIGN_TEACHERS: 'assign_teachers',
  MANAGE_CLASS_ROSTER: 'manage_class_roster',
  
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
  
  // Communication
  SEND_MESSAGES: 'send_messages',
  VIEW_MESSAGES: 'view_messages',
  BROADCAST_MESSAGES: 'broadcast_messages',
  
  // Events Management
  VIEW_EVENTS: 'view_events',
  CREATE_EVENTS: 'create_events',
  EDIT_EVENTS: 'edit_events',
  DELETE_EVENTS: 'delete_events',
  MANAGE_EVENT_REGISTRATION: 'manage_event_registration',
  
  // Reports & Analytics
  VIEW_BASIC_REPORTS: 'view_basic_reports',
  VIEW_DETAILED_REPORTS: 'view_detailed_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // System Administration
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_SYSTEM_HEALTH: 'view_system_health',
  MANAGE_BACKUPS: 'manage_backups',
  MANAGE_INTEGRATIONS: 'manage_integrations'
} as const;
