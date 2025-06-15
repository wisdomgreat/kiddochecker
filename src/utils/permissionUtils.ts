
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

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
 * Check if current user has a specific permission
 */
export const hasPermission = async (permissionName: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (roleError || !roleData) return false;
    
    // Super admins have all permissions
    if (roleData.role === 'super_admin' || roleData.is_super_admin) {
      return true;
    }
    
    // For now, simplified permission check based on role
    // This avoids the complex type inference issues
    const userRole = roleData.role as string;
    
    // Basic role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'admin': [
        'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles',
        'view_children', 'create_children', 'edit_children', 'delete_children',
        'view_classes', 'create_classes', 'edit_classes', 'delete_classes',
        'view_reports', 'create_reports', 'export_reports',
        'manage_organization', 'view_audit_logs', 'manage_permissions'
      ],
      'staff': [
        'view_children', 'edit_children', 'view_classes', 'checkin_children', 
        'checkout_children', 'view_attendance', 'send_messages', 'view_messages'
      ],
      'teacher': [
        'view_children', 'view_classes', 'checkin_children', 'checkout_children', 
        'view_attendance', 'send_messages', 'view_messages'
      ],
      'teacher_assistant': [
        'view_children', 'view_classes', 'checkin_children', 'checkout_children', 
        'view_attendance'
      ],
      'parent': [
        'view_children', 'checkin_children', 'checkout_children', 'view_attendance', 
        'view_messages'
      ]
    };
    
    return rolePermissions[userRole]?.includes(permissionName) || false;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Check if user can access parent features - STRICT: Admin users cannot access parent features
 */
export const canAccessParentFeatures = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!roleData) return false;
    
    // STRICT RULE: Admin and super_admin users cannot access parent features
    if (roleData.role === 'admin' || roleData.role === 'super_admin' || roleData.is_super_admin) {
      return false;
    }
    
    // Only parent role can access parent features
    return roleData.role === 'parent';
  } catch (error) {
    console.error("Error checking parent access:", error);
    return false;
  }
};

/**
 * Check if user can access admin features
 */
export const canAccessAdminFeatures = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!roleData) return false;
    
    return ['admin', 'super_admin'].includes(roleData.role as string) || roleData.is_super_admin;
  } catch (error) {
    console.error("Error checking admin access:", error);
    return false;
  }
};

/**
 * Log audit event
 */
export const logAuditEvent = async (
  action: string,
  resource: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    console.log("Audit Event:", {
      user_id: user.id,
      action,
      resource,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
};

/**
 * Get user's permissions with simplified approach
 */
export const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!roleData) return [];
    
    // Get all permissions for super admins
    if (roleData.role === 'super_admin' || roleData.is_super_admin) {
      const { data: allPermissions } = await supabase
        .from('permissions')
        .select('*');
      return allPermissions || [];
    }
    
    // Return empty array for now - this can be enhanced later
    return [];
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
};

/**
 * Role-based permission checks
 */
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_ROLES: 'manage_roles',
  
  // Children management
  VIEW_CHILDREN: 'view_children',
  CREATE_CHILDREN: 'create_children',
  EDIT_CHILDREN: 'edit_children',
  DELETE_CHILDREN: 'delete_children',
  
  // Class management
  VIEW_CLASSES: 'view_classes',
  CREATE_CLASSES: 'create_classes',
  EDIT_CLASSES: 'edit_classes',
  DELETE_CLASSES: 'delete_classes',
  MANAGE_CLASS_ASSIGNMENTS: 'manage_class_assignments',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  CREATE_REPORTS: 'create_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Organization
  MANAGE_ORGANIZATION: 'manage_organization',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_PERMISSIONS: 'manage_permissions',
  
  // Attendance
  CHECKIN_CHILDREN: 'checkin_children',
  CHECKOUT_CHILDREN: 'checkout_children',
  VIEW_ATTENDANCE: 'view_attendance',
  
  // Communication
  SEND_MESSAGES: 'send_messages',
  VIEW_MESSAGES: 'view_messages',
  MANAGE_EVENTS: 'manage_events'
} as const;

/**
 * Role hierarchy for access control
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  'super_admin': 6,
  'admin': 5,
  'staff': 4,
  'teacher': 3,
  'teacher_assistant': 2,
  'parent': 1
};

/**
 * Check if user role has sufficient privilege level
 */
export const hasRoleLevel = async (requiredLevel: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!roleData) return false;
    
    const userLevel = ROLE_HIERARCHY[roleData.role] || 0;
    return userLevel >= requiredLevel;
  } catch (error) {
    console.error("Error checking role level:", error);
    return false;
  }
};
