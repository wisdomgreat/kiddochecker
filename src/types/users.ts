
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  phone?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'parent' | 'admin' | 'staff' | 'teacher' | 'teacher_assistant';
  phone?: string;
}

export const formatUserData = (user: any): UserProfile => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    role: user.role,
    isActive: user.is_active !== false,
    createdAt: user.created_at,
    phone: user.phone || ''
  };
};

