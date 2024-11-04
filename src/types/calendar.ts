export type ServiceType = 'couch' | 'carpet' | 'car-seats' | 'mattress';
export type Location = 
  | 'Bastos' | 'Mvan' | 'Nsam' | 'Mvog-Mbi' | 'Essos' 
  | 'Mimboman' | 'Nkoldongo' | 'Ekounou' | 'Emana' 
  | 'Nkolbisson' | 'Olembe' | 'Ngousso' | 'Messa' 
  | 'Omnisport' | 'Tsinga' | 'Etoa-Meki' | 'Nlongkak';

export type Size = 'small' | 'medium' | 'large';

export interface ServiceDetails {
  couch?: {
    type: 'leather' | 'tissue';
    seats: number;
  };
  carpet?: {
    size: Size;
  };
  'car-seats'?: {
    seats: number;
  };
  mattress?: {
    size: Size;
  };
}

export interface Booking {
  id: string;
  services: {
    type: ServiceType;
    details: ServiceDetails;
  }[];
  location: Location;
  address: string;
  phone: string;
  datetime: string;
  endTime?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isAllDay?: boolean;
}