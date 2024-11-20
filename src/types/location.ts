export interface LocationFormData {
  id?: string; 
  name: string;
  commune: string;
  standing: string;
  neighboring: string[];
}

export interface LocationRow {
  id: string;
  name: string;
  commune: string;
  standing: string;
  neighboring: string[];
  created_at?: string;
  updated_at?: string;
  // Prospect counts
  pending_count: number;
  confirmed_count: number;
  completed_count: number;
  total_prospects: number;
}
