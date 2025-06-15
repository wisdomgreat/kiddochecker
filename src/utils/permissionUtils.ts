
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
    
    // Get user role with explicit typing
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (roleError || !roleData) return false;
    
    // Super admins have all permissions
    if (roleData.role === 'super_admin' || roleData.is_super_admin) {
      return true;
    }
    
    // Use a direct approach to avoid type inference issues
    const userRole = roleData.role as string;
    
    // Get permission IDs for this role
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role', userRole);
    
    if (!rolePerms || rolePerms.length === 0) return false;
    
    // Extract permission IDs with explicit typing
    const permIds: string[] = [];
    for (const perm of rolePerms) {
      if (perm.permission_id) {
        permIds.push(perm.permission_id);
      }
    }
    
    if (permIds.length === 0) return false;
    
    // Check if any of these permissions match what we're looking for
    const { data: perms } = await supabase
      .from('permissions')
      .select('name')
      .in('id', permIds);
    
    if (!perms) return false;
    
    // Check if permission exists
    for (const perm of perms) {
      if (perm.name === permissionName) {
        return true;
      }
    }
    
    return false;
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
      .maybeSingle();
    
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
      .maybeSingle();
    
    if (!roleData) return false;
    
    return ['admin', 'super_admin'].includes(roleData.role as string) || roleData.is_super_admin;
  } catch (error) {
    console.error("Error checking admin access:", error);
    return false;
  }
};

/**
 * Log audit event - Using console log for now since audit_logs table not in current Supabase types
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
    
    // Log to console for now - will be updated once audit_logs table is available
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
      .maybeSingle();
    
    if (!roleData) return [];
    
    // Super admins get all permissions
    if (roleData.role === 'super_admin' || roleData.is_super_admin) {
      const { data: allPermissions } = await supabase
        .from('permissions')
        .select('*');
      return allPermissions || [];
    }
    
    // Get role permissions with explicit typing
    const userRole = roleData.role as string;
    
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role', userRole);
    
    if (!rolePerms || rolePerms.length === 0) return [];
    
    // Extract permission IDs safely
    const permIds: string[] = [];
    for (const perm of rolePerms) {
      if (perm.permission_id) {
        permIds.push(perm.permission_id);
      }
    }
    
    if (permIds.length === 0) return [];
    
    const { data: permissions } = await supabase
      .from('permissions')
      .select('*')
      .in('id', permIds);
    
    return permissions || [];
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
      .maybeSingle();
    
    if (!roleData) return false;
    
    const userLevel = ROLE_HIERARCHY[roleData.role] || 0;
    return userLevel >= requiredLevel;
  } catch (error) {
    console.error("Error checking role level:", error);
    return false;
  }
};
