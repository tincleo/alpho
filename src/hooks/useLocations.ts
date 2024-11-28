import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { LocationRow, LocationFormData } from '../types/location';
import { realtimeManager } from '../lib/realtimeManager';
import { useEffect } from 'react';

export const LOCATIONS_QUERY_KEY = ['locations'];

export function useLocations() {
  const queryClient = useQueryClient();

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('location_prospect_counts')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as LocationRow[];
  };

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    queryFn: fetchLocations,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    realtimeManager.subscribe('locations-main', {
      onLocationChange: async (payload) => {
        // Optimistically update the cache
        queryClient.setQueryData(LOCATIONS_QUERY_KEY, (oldData: LocationRow[] = []) => {
          switch (payload.eventType) {
            case 'INSERT':
              return [...oldData, payload.new].sort((a, b) => a.name.localeCompare(b.name));
            case 'UPDATE':
              return oldData.map(location => 
                location.id === payload.new?.id ? { ...location, ...payload.new } : location
              );
            case 'DELETE':
              // Also update neighboring arrays when a location is deleted
              return oldData
                .filter(location => location.id !== payload.old?.id)
                .map(location => ({
                  ...location,
                  neighboring: location.neighboring.filter(id => id !== payload.old?.id)
                }));
            default:
              return oldData;
          }
        });

        // Refetch to ensure consistency
        await queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
      }
    });

    return () => {
      realtimeManager.unsubscribe('locations-main');
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (formData: LocationFormData) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      const { data, error } = await supabase.from('locations').insert([formData]).select().single();
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: LocationFormData }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      const { data, error } = await supabase
        .from('locations')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      // First, remove this location from all neighboring arrays
      const { error: updateError } = await supabase
        .from('locations')
        .update({ 
          neighboring: supabase.raw(`array_remove(neighboring, '${id}')`) 
        })
        .neq('id', id);
      
      if (updateError) throw updateError;

      // Then delete the location
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
    },
  });

  return {
    locations,
    isLoading,
    error,
    createLocation: createMutation.mutate,
    updateLocation: updateMutation.mutate,
    deleteLocation: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
