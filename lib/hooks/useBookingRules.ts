'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

interface BookingRules {
  advance_booking: {
    min_hours: number;
    max_days: number;
  };
  cancellation: {
    allowed_hours_before: number;
    charge_fee: boolean;
    fee_percentage: number;
  };
  buffer_time: {
    before_minutes: number;
    after_minutes: number;
  };
  online_booking: {
    enabled: boolean;
    require_approval: boolean;
    allow_same_day: boolean;
  };
  capacity: {
    max_concurrent_bookings: number;
    overbooking_allowed: boolean;
    overbooking_percentage: number;
  };
  restrictions: {
    max_bookings_per_client_per_day: number;
    max_bookings_per_client_per_week: number;
    require_phone_number: boolean;
    require_email: boolean;
  };
}

export function useBookingRules() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: bookingRules, isLoading, error } = useQuery({
    queryKey: ['booking-rules', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('booking_settings')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data?.booking_settings as BookingRules | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidateBookingRules = () => {
    queryClient.invalidateQueries({ queryKey: ['booking-rules', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };

  // Helper function to check if a booking time is valid
  const isValidBookingTime = (requestedTime: Date): { valid: boolean; reason?: string } => {
    if (!bookingRules) return { valid: true };

    const now = new Date();
    const timeDiffHours = (requestedTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const timeDiffDays = timeDiffHours / 24;

    // Check minimum advance booking time
    if (timeDiffHours < bookingRules.advance_booking.min_hours) {
      return {
        valid: false,
        reason: `Minimum ${bookingRules.advance_booking.min_hours} uren vooruit boeken vereist`
      };
    }

    // Check maximum advance booking time
    if (timeDiffDays > bookingRules.advance_booking.max_days) {
      return {
        valid: false,
        reason: `Maximaal ${bookingRules.advance_booking.max_days} dagen vooruit boeken toegestaan`
      };
    }

    // Check same day booking if not allowed
    if (!bookingRules.online_booking.allow_same_day) {
      const isToday = requestedTime.toDateString() === now.toDateString();
      if (isToday) {
        return {
          valid: false,
          reason: 'Boeken voor dezelfde dag is niet toegestaan'
        };
      }
    }

    return { valid: true };
  };

  // Helper function to check if cancellation is allowed
  const isCancellationAllowed = (appointmentTime: Date): { allowed: boolean; feeRequired?: boolean; feePercentage?: number; reason?: string } => {
    if (!bookingRules) return { allowed: true };

    const now = new Date();
    const timeDiffHours = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (timeDiffHours < 0) {
      return {
        allowed: false,
        reason: 'Kan geen afspraken in het verleden annuleren'
      };
    }

    if (timeDiffHours >= bookingRules.cancellation.allowed_hours_before) {
      return { allowed: true };
    }

    return {
      allowed: true,
      feeRequired: bookingRules.cancellation.charge_fee,
      feePercentage: bookingRules.cancellation.fee_percentage,
      reason: `Annulering binnen ${bookingRules.cancellation.allowed_hours_before} uur${bookingRules.cancellation.charge_fee ? ` - ${bookingRules.cancellation.fee_percentage}% kosten` : ''}`
    };
  };

  // Helper function to get available time slots with buffer time
  const getTimeSlotWithBuffer = (startTime: Date, duration: number): { start: Date; end: Date; bufferStart: Date; bufferEnd: Date } => {
    const bufferBefore = bookingRules?.buffer_time.before_minutes || 0;
    const bufferAfter = bookingRules?.buffer_time.after_minutes || 0;

    const bufferStart = new Date(startTime.getTime() - bufferBefore * 60000);
    const end = new Date(startTime.getTime() + duration * 60000);
    const bufferEnd = new Date(end.getTime() + bufferAfter * 60000);

    return {
      start: startTime,
      end,
      bufferStart,
      bufferEnd
    };
  };

  // Helper function to validate client booking limits
  const validateClientBookingLimits = (clientId: string, requestedDate: Date): Promise<{ valid: boolean; reason?: string }> => {
    // This would need to be implemented to check against existing bookings
    // For now, return valid
    return Promise.resolve({ valid: true });
  };

  return {
    bookingRules,
    isLoading,
    error,
    invalidateBookingRules,
    isValidBookingTime,
    isCancellationAllowed,
    getTimeSlotWithBuffer,
    validateClientBookingLimits
  };
}