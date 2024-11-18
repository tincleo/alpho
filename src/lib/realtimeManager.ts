import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Prospect, Service, Reminder } from '../types/calendar';

type RealtimeCallback = {
  onProspectChange?: (payload: { new: any; old: any; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void;
  onReminderChange?: (payload: { new: any; old: any; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void;
  onServiceChange?: (payload: { new: any; old: any; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void;
};

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private callbacks: RealtimeCallback = {};

  constructor() {
    // Enable realtime for our tables
    supabase.channel('public:prospects').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'prospects',
    }, () => {});

    supabase.channel('public:reminders').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reminders',
    }, () => {});

    supabase.channel('public:services').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'services',
    }, () => {});
  }

  subscribe(callbacks: RealtimeCallback) {
    this.callbacks = callbacks;

    // Create a new channel for all our subscriptions
    this.channel = supabase.channel('calendar-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prospects',
      }, (payload) => {
        if (this.callbacks.onProspectChange) {
          this.callbacks.onProspectChange(payload);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reminders',
      }, (payload) => {
        if (this.callbacks.onReminderChange) {
          this.callbacks.onReminderChange(payload);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
      }, (payload) => {
        if (this.callbacks.onServiceChange) {
          this.callbacks.onServiceChange(payload);
        }
      });

    this.channel.subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.callbacks = {};
  }
}

export const realtimeManager = new RealtimeManager();
