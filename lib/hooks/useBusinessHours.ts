'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export function useBusinessHours() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: businessHours, isLoading, error } = useQuery({
    queryKey: ['business-hours', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('business_hours')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data?.business_hours as BusinessHours | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidateBusinessHours = () => {
    queryClient.invalidateQueries({ queryKey: ['business-hours', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };

  // Helper function to check if salon is currently open
  const isCurrentlyOpen = (): boolean => {
    if (!businessHours) return false;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour * 60 + minutes;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayHours = businessHours[days[day] as keyof BusinessHours];

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
    if (!businessHours) return null;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const checkDay = (now.getDay() + i) % 7;
      const dayHours = businessHours[days[checkDay] as keyof BusinessHours];
      
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

  return {
    businessHours,
    isLoading,
    error,
    invalidateBusinessHours,
    isCurrentlyOpen,
    getNextOpeningTime
  };
}