/**
 * Canonical staff types for the KiddoChecker application.
 * All hooks and components should import from here.
 */
import { AppRole } from './events';

export interface StaffMember {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: AppRole;
  is_super_admin: boolean;
  is_volunteer: boolean;
  is_active: boolean;
  verification_status?: string;
}

export interface AddStaffData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: AppRole;
  is_volunteer?: boolean;
}

export interface UpdateStaffData {
  userId: string;
  updates: Partial<Pick<StaffMember,
    'first_name' | 'last_name' | 'phone' | 'role' | 'is_active' | 'is_volunteer'
  >>;
}
