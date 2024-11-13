export type ServiceType = 'couch' | 'carpet' | 'auto-detailing' | 'mattress';

export type Size = 'small' | 'medium' | 'large';

export interface ServiceDetails {
  [key: string]: {
    size?: Size;
    material?: 'leather' | 'tissue';
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

export type ProspectStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type SaveStatus = "saving" | "error" | "saved" | undefined;

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  datetime: string;
  location?: string;
  location_id?: string;
  address?: string;
  notes?: string;
  status: ProspectStatus;
  priority: "low" | "medium" | "high";
  isAllDay: boolean;
  services: Service[];
  reminders: Reminder[];
  saveStatus?: SaveStatus;
  originalData?: Omit<Prospect, 'id' | 'saveStatus' | 'originalData'>;
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