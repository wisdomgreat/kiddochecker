
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
