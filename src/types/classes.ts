
export interface Class {
  id: string;
  name: string;
  description?: string;
  age_range?: string;
  capacity?: number;
  room?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassTeacher {
  id: string;
  class_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClassWithTeacher extends Class {
  teacher_name?: string;
}
