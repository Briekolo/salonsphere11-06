'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

export interface BusinessHours {
  [key: string]: {
    closed: boolean;
    open?: string;
    close?: string;
  };
}

export interface TenantSettings {
  business_hours: BusinessHours;
  timezone: string;
}

export function useBusinessHours() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: tenantSettings, isLoading, error } = useQuery({
    queryKey: ['business-hours', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('business_hours, timezone')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data as TenantSettings | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidateBusinessHours = () => {
    queryClient.invalidateQueries({ queryKey: ['business-hours', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };

  // Helper function to check if salon is currently open
  const isCurrentlyOpen = (): boolean => {
    if (!tenantSettings?.business_hours) return false;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour * 60 + minutes;

    const todayHours = tenantSettings.business_hours[day.toString()];

    if (todayHours?.closed || !todayHours?.open || !todayHours?.close) {
      return false;
    }

    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime < closeTime;
  };

  // Helper function to get next opening time
  const getNextOpeningTime = (): { day: string; time: string } | null => {
    if (!tenantSettings?.business_hours) return null;

    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const checkDay = (now.getDay() + i) % 7;
      const dayHours = tenantSettings.business_hours[checkDay.toString()];
      
      if (!dayHours?.closed && dayHours?.open) {
        // If it's today, check if we haven't passed opening time yet
        if (i === 0) {
          const [openHour, openMin] = dayHours.open.split(':').map(Number);
          const openTime = openHour * 60 + openMin;
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          if (currentTime < openTime) {
            return { day: 'vandaag', time: dayHours.open };
          }
        } else {
          return { day: dayNames[checkDay], time: dayHours.open };
        }
      }
    }
    
    return null;
  };

  // Helper function to check if a specific date is available
  const isDateAvailable = (date: Date): boolean => {
    if (!tenantSettings?.business_hours) return true; // Default to available if no settings
    
    const dayOfWeek = date.getDay().toString();
    const dayConfig = tenantSettings.business_hours[dayOfWeek];
    
    return !dayConfig?.closed;
  };

  // Helper function to get available hours for a date
  const getAvailableHours = (date: Date): { open: string; close: string } | null => {
    if (!tenantSettings?.business_hours) return null;
    
    const dayOfWeek = date.getDay().toString();
    const dayConfig = tenantSettings.business_hours[dayOfWeek];
    
    if (!dayConfig || dayConfig.closed || !dayConfig.open || !dayConfig.close) {
      return null;
    }
    
    return {
      open: dayConfig.open,
      close: dayConfig.close
    };
  };

  return {
    businessHours: tenantSettings?.business_hours,
    timezone: tenantSettings?.timezone,
    isLoading,
    error,
    invalidateBusinessHours,
    isCurrentlyOpen,
    getNextOpeningTime,
    isDateAvailable,
    getAvailableHours
  };
}