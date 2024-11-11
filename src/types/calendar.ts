export type ServiceType = 'couch' | 'carpet' | 'auto-detailing' | 'mattress';

export interface ServiceDetails {
  [key: string]: {
    size?: string;
    material?: string;
    quantity?: number;
    seats?: number;
    cleaningMode?: 'seats-only' | 'full-interior' | 'gold-cleaning';
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

export interface Prospect {
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

interface ProspectModalProps {
  prospect: Prospect;
  // ...
}

interface DayProspectsModalProps {
  prospects: Prospect[];
  // ...
}