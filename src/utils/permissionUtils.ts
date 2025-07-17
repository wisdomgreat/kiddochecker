
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
 * Check if current user has a specific permission using the new granular system
 */
export const hasPermission = async (permissionName: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase.rpc('check_user_permission', {
      p_user_id: user.id,
      p_permission_name: permissionName
    });
    
    if (error) {
      console.error("Error checking permission:", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Exception checking permission:", error);
    return false;
  }
};

/**
 * Get user's permissions with the new system
 */
export const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Get all permissions for the current user
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        id,
        name,
        resource,
        action,
        description
      `);
    
    if (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
    
    // Filter permissions based on user's actual permissions
    const userPermissions = [];
    for (const permission of data || []) {
      const hasAccess = await hasPermission(permission.name);
      if (hasAccess) {
        userPermissions.push(permission);
      }
    }
    
    return userPermissions;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
};

/**
 * Admin function to manage users
 */
export const adminManageUser = async (
  action: string,
  targetUserId: string,
  data: any = {}
): Promise<{ success: boolean; error?: string; result?: any }> => {
  try {
    const { data: result, error } = await supabase.rpc('admin_manage_user', {
      p_action: action,
      p_target_user_id: targetUserId,
      p_data: data
    });
    
    if (error) {
      console.error("Error in admin user management:", error);
      return { success: false, error: error.message };
    }
    
    if (result && typeof result === 'object' && 'error' in result) {
      return { success: false, error: result.error };
    }
    
    return { success: true, result };
  } catch (error: any) {
    console.error("Exception in admin user management:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboardStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    
    if (error) {
      console.error("Error fetching admin dashboard stats:", error);
      return null;
    }
    
    if (data && typeof data === 'object' && 'error' in data) {
      console.error("Permission error:", data.error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching admin dashboard stats:", error);
    return null;
  }
};

/**
 * Log audit event
 */
export const logAuditEvent = async (
  action: string,
  resource: string,
  resourceId?: string,
  details?: any
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('log_admin_action', {
      p_action: action,
      p_resource: resource,
      p_resource_id: resourceId,
      p_details: details || {}
    });
    
    if (error) {
      console.error("Error logging audit event:", error);
    }
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
