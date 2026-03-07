/**
 * @deprecated Import from `useStaffManagement` instead.
 * This file is kept for backward compatibility and re-exports everything
 * from the canonical hook. Remove this file once all consumers are updated.
 */
export {
  useStaffManagement as useStaff,
  useStaffManagement as default,
} from './useStaffManagement';

export type { StaffMember, AddStaffData, UpdateStaffData } from '@/types/staff';
