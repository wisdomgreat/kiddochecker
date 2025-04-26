
import { AppRole } from "./events";

export interface UserRoleData {
  role: AppRole;
  is_super_admin?: boolean;
}
