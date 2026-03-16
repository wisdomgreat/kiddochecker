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
  staff_pin?: string;
  avatar_url?: string;
  photo_url?: string;
  department?: string;
  staff_groups?: string[]; // IDs of groups
  specialties?: string[];
  max_hours_per_week?: number;
}

export interface AddStaffData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: AppRole;
  is_volunteer?: boolean;
  staff_pin?: string;
  department?: string;
  specialties?: string[];
  max_hours_per_week?: number;
  staff_groups?: string[];
}

export interface UpdateStaffData {
  userId: string;
  updates: Partial<Pick<StaffMember,
    'first_name' | 'last_name' | 'phone' | 'role' | 'is_active' | 'is_volunteer' | 'staff_pin' | 'department' | 'staff_groups' | 'specialties' | 'max_hours_per_week'
  >>;
}
