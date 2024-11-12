export type ServiceType = 'couch' | 'carpet' | 'auto-detailing' | 'mattress' | 'car-seats';

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
  prospect_id: string;
  datetime: string;
  note?: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
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

export interface DayProspectsModalProps {
  prospects: Prospect[];
  // ...
}

export type ViewMode = 'week' | 'month' | 'agenda';
export type Location = 'Bastos' | 'Mvan' | 'Nsam' | 'Mvog-Mbi' | 'Essos' | 
  'Mimboman' | 'Nkoldongo' | 'Ekounou' | 'Emana' | 
  'Nkolbisson' | 'Olembe' | 'Ngousso' | 'Messa' | 
  'Omnisport' | 'Tsinga' | 'Etoa-Meki' | 'Nlongkak';

export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  prospects: Prospect[];
}