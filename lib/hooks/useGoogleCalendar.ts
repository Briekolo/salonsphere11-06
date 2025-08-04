import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useTenant } from './useTenant';
import { GoogleCalendarIntegration } from '@/lib/services/googleCalendarService';

// Get Google Calendar integration for current tenant
export function useGoogleCalendarIntegration() {
  const { tenant } = useTenant();
  
  return useQuery({
    queryKey: ['google-calendar-integration', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('integration_type', 'google_calendar')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as GoogleCalendarIntegration | null;
    },
    enabled: !!tenant?.id
  });
}

// Create or update Google Calendar integration
export function useCreateGoogleCalendarIntegration() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (tokens: {
      access_token: string;
      refresh_token: string;
      expiry_date: number;
    }) => {
      if (!tenant?.id) throw new Error('No tenant found');

      const integrationData = {
        tenant_id: tenant.id,
        integration_type: 'google_calendar',
        name: 'Google Calendar',
        is_connected: true,
        connected_at: new Date().toISOString(),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date).toISOString(),
        settings: {
          sync_direction: 'both',
          auto_accept_appointments: true,
          appointment_color: '#4285f4',
          include_client_details: true,
          reminder_minutes: [15, 60],
          sync_cancelled_appointments: false
        }
      };

      const { data, error } = await supabase
        .from('integrations')
        .upsert(integrationData, { 
          onConflict: 'tenant_id,integration_type',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-integration', tenant?.id] 
      });
    }
  });
}

// Update Google Calendar integration settings
export function useUpdateGoogleCalendarSettings() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (settings: Partial<GoogleCalendarIntegration['settings']>) => {
      if (!tenant?.id) throw new Error('No tenant found');

      const { data, error } = await supabase
        .from('integrations')
        .update({ 
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant.id)
        .eq('integration_type', 'google_calendar')
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-integration', tenant?.id] 
      });
    }
  });
}

// Disconnect Google Calendar integration
export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('No tenant found');

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('integration_type', 'google_calendar');

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-integration', tenant?.id] 
      });
    }
  });
}

// Get Google Calendar settings from tenant
export function useGoogleCalendarSettings() {
  const { tenant } = useTenant();
  
  return useQuery({
    queryKey: ['google-calendar-settings', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('google_calendar_settings, google_calendar_last_sync')
        .eq('id', tenant.id)
        .single();

      if (error) throw error;

      return data;
    },
    enabled: !!tenant?.id
  });
}

// Update Google Calendar settings in tenant
export function useUpdateGoogleCalendarTenantSettings() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (settings: any) => {
      if (!tenant?.id) throw new Error('No tenant found');

      const { data, error } = await supabase
        .from('tenants')
        .update({ 
          google_calendar_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['google-calendar-settings', tenant?.id] 
      });
    }
  });
}

// Get Google Calendar lists
export function useGoogleCalendarLists() {
  const { data: integration } = useGoogleCalendarIntegration();
  
  return useQuery({
    queryKey: ['google-calendar-lists', integration?.id],
    queryFn: async () => {
      if (!integration?.is_connected) return [];

      const response = await fetch('/api/google-calendar/calendars', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar lists');
      }

      return response.json();
    },
    enabled: !!integration?.is_connected
  });
}

// Sync appointment to Google Calendar
export function useSyncToGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch('/api/google-calendar/sync-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync appointment to Google Calendar');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}

// Test Google Calendar connection
export function useTestGoogleCalendarConnection() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google-calendar/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to test Google Calendar connection');
      }

      return response.json();
    }
  });
}