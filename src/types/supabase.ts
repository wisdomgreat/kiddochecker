
import { AppRole } from "./events";

export { AppRole };

export interface UserRoleData {
  role: AppRole;
  is_super_admin?: boolean;
}

// Define missing types that are needed across the application
export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface ThemeSettings {
  primaryColor: string;
  fontFamily: string;
  logoUrl?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  phone?: string;
  is_active: boolean;
  is_super_admin?: boolean;
  created_at: string;
}

export interface DeviceProfile {
  id: string;
  device_id: string;
  name: string;
  type: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

// Add any other types that might be needed
export interface ClassTeacher {
  id: string;
  class_id: string;
  user_id: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}
