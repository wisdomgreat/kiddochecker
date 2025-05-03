
import { AppRole, UserRoleData } from "@/types/supabase";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  roleData?: UserRoleData;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  lastSignIn?: string;
  children?: number;
  name?: string;
  contact?: string;
  activity?: string;
  status?: boolean;
}

// Add this function to get properly formatted user data
export const formatUserData = (data: any): UserProfile => {
  return {
    id: data.id || '',
    email: data.email || '',
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    role: data.role || 'parent',
    roleData: {
      role: data.role || 'parent',
      is_super_admin: Boolean(data.is_super_admin)
    },
    phone: data.phone || '',
    createdAt: data.created_at || '',
    isActive: Boolean(data.is_active),
    lastSignIn: data.last_sign_in || '',
    children: data.children || 0
  };
};
