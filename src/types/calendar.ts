export type ServiceType = 'couch' | 'carpet' | 'car-seats' | 'mattress';

export interface ServiceDetails {
  [key: string]: {
    size?: string;
    material?: string;
    stains?: boolean;
    quantity?: number;
  };
}

export interface Service {
  id: string;
  type: ServiceType;
  details: ServiceDetails;
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