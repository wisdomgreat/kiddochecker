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

export type AppRole = "admin" | "teacher" | "parent" | "staff" | "super_admin";
