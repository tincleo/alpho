import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Prospect, Service, Reminder } from '../types/calendar';
import { Database } from './database.types';

type ProspectRow = Database['public']['Tables']['prospects']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];
type ReminderRow = Database['public']['Tables']['reminders']['Row'];

type RealtimeCallback = {
  onProspectChange?: (payload: RealtimePostgresChangesPayload<{
    old: ProspectRow | null;
    new: ProspectRow | null;
  }>) => void;
  onReminderChange?: (payload: RealtimePostgresChangesPayload<{
    old: ReminderRow | null;
    new: ReminderRow | null;
  }>) => void;
  onServiceChange?: (payload: RealtimePostgresChangesPayload<{
    old: ServiceRow | null;
    new: ServiceRow | null;
  }>) => void;
};

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, RealtimeCallback> = new Map();

  constructor() {
    this.enableRealtimeForTable('prospects');
    this.enableRealtimeForTable('reminders');
    this.enableRealtimeForTable('services');
  }

  private enableRealtimeForTable(table: string) {
    supabase.channel(`public:${table}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
      }, () => {})
      .subscribe((status) => {
        console.log(`Realtime status for ${table}:`, status);
      });
  }

  subscribe(channelId: string, callbacks: RealtimeCallback) {
    this.unsubscribe(channelId); // Clean up any existing subscription
    this.callbacks.set(channelId, callbacks);

    const channel = supabase.channel(`calendar-updates-${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prospects',
      }, (payload) => {
        const callback = this.callbacks.get(channelId);
        if (callback?.onProspectChange) {
          callback.onProspectChange(payload);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reminders',
      }, (payload) => {
        const callback = this.callbacks.get(channelId);
        if (callback?.onReminderChange) {
          callback.onReminderChange(payload);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
      }, (payload) => {
        const callback = this.callbacks.get(channelId);
        if (callback?.onServiceChange) {
          callback.onServiceChange(payload);
        }
      });

    channel.subscribe((status) => {
      console.log(`Realtime status for channel ${channelId}:`, status);
    });
    
    this.channels.set(channelId, channel);
  }

  unsubscribe(channelId: string) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelId);
    }
    this.callbacks.delete(channelId);
  }
}

export const realtimeManager = new RealtimeManager();
