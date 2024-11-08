// ... existing type definitions ...
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type StatusType = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PriorityType = 'low' | 'medium' | 'high';

export type Database = {
  public: {
    Tables: {
      prospects: {
        Row: {
          id: string
          name: string | null
          phone: string
          location: string
          address: string | null
          datetime: string
          end_time: string | null
          status: StatusType
          priority: PriorityType
          is_all_day: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['prospects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prospects']['Insert']>
      }
      services: {
        Row: {
          id: string
          prospect_id: string
          type: string
          details: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      reminders: {
        Row: {
          id: string
          prospect_id: string
          datetime: string
          note: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
      }
    }
  }
}