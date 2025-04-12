
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate?: Date | string;
  location?: string;
  organizer?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EventFormValues {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  organizer?: string;
  isPublic: boolean;
}
