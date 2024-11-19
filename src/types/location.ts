export interface LocationFormData {
  id?: number; 
  name: string;
  commune: string;
  standing: string;
  neighboring: string[];
}

export interface LocationRow {
  id: number;
  name: string;
  commune: string;
  standing: string;
  neighboring: string[];
}
