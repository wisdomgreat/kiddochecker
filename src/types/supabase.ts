
// Extended app_role type to include the new roles added in our migration
export type AppRole = 'admin' | 'staff' | 'parent' | 'super_admin' | 'teacher' | 'assistant';

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
