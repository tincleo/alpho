export interface Service {
  id: string;
  type: string;
  details: Record<string, unknown>;
}

export interface Reminder {
  id: string;
  datetime: string;
  note?: string;
  completed: boolean;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  datetime: string;
  location?: string;
  address?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  isAllDay: boolean;
  services: Service[];
  reminders: Reminder[];
}