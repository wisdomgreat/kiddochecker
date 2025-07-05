
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
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
