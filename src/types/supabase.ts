
// Match the exact definition in database app_role enum
export type AppRole = 'admin' | 'staff' | 'parent' | 'super_admin';

// Interface for user role data returned from Supabase
export interface UserRoleData {
  role: AppRole;
  is_super_admin?: boolean;
}

// Interface for staff members
export interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: AppRole;
  isSuperAdmin: boolean;
  isActive: boolean;
}
