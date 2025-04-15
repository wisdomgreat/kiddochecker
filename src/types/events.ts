
export interface EventItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  organizer?: string | null;
  isPublic?: boolean;
}

export interface EventFormValues {
  title: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date | null;
  organizer?: string;
  isPublic?: boolean;
}

// Updated to match exactly the definition in src/types/supabase.ts
export type AppRole = 'admin' | 'staff' | 'parent' | 'super_admin' | 'teacher' | 'assistant';
