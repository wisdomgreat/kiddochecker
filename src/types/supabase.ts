
// Match the exact definition in database app_role enum
export type AppRole = 'admin' | 'staff' | 'teacher' | 'parent' | 'super_admin' | 'teacher_assistant';

// Interface for user role data returned from Supabase
export interface UserRoleData {
  role: AppRole;
  is_super_admin?: boolean;
  is_volunteer?: boolean;
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
  isVolunteer?: boolean;
  isActive: boolean;
}

// Interface for activity logs
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details?: string;
  timestamp: string;
  userName?: string;
}

// Interface for settings
export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'purple' | 'blue' | 'green' | 'orange';
  highContrast: boolean;
  largeText: boolean;
  animations: boolean;
}

// Interface for organization settings
export interface OrganizationSettings {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  fontFamily: string;
}

// Interface for device profile
export interface DeviceProfile {
  id: string;
  deviceId: string;
  name: string;
  type: 'check_in_kiosk' | 'check_out_station';
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for custom role
export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Interface for permission
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
}

// Interface for role permission
export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at?: string;
}
