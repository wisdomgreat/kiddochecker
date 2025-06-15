
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
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!roleData) return false;
    
    // Super admins have all permissions
    if (roleData.role === 'super_admin' || roleData.is_super_admin) {
      return true;
    }
    
    // Check role-specific permissions
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select(`
        permissions:permission_id (
          name
        )
      `)
      .eq('role', roleData.role);
    
    if (!permissions) return false;
    
    return permissions.some((p: any) => p.permissions?.name === permissionName);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Check if user can access parent features
 */
export const canAccessParentFeatures = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return roleData?.role === 'parent';
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
    
    return ['admin', 'super_admin'].includes(roleData.role) || roleData.is_super_admin;
  } catch (error) {
    console.error("Error checking admin access:", error);
    return false;
  }
};

/**
 * Log audit event - Using direct SQL since audit_logs table not in current Supabase types
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
    
    // Since audit_logs table is new and not in types yet, we'll use a simple approach
    // This will be updated once the types are regenerated
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
 * Get user's permissions
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
    
    // Get role-specific permissions
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select(`
        permissions:permission_id (
          id,
          name,
          resource,
          action,
          description
        )
      `)
      .eq('role', roleData.role);
    
    if (!permissions) return [];
    
    return permissions.map((p: any) => p.permissions).filter(Boolean);
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
