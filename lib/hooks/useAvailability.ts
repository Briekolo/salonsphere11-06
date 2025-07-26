import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AvailabilityService, TimeSlot, BookingHold } from '@/lib/services/availabilityService';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Generate or get session ID for guest users
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('booking_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('booking_session_id', sessionId);
  }
  return sessionId;
};

// Hook to get available time slots
export function useAvailableSlots(
  tenantId: string,
  date: string,
  serviceId: string,
  staffId?: string
) {
  const queryKey = ['available-slots', tenantId, date, serviceId, staffId];
  
  const query = useQuery({
    queryKey,
    queryFn: () => AvailabilityService.getAvailableSlots(tenantId, date, serviceId, staffId),
    enabled: !!tenantId && !!date && !!serviceId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for real-time updates
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tenantId || !date) return;

    const channel = supabase
      .channel(`availability:${tenantId}:${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_holds',
          filter: `tenant_id=eq.${tenantId},slot_date=eq.${date}`
        },
        () => {
          query.refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, date, query.refetch]);

  return query;
}

// Hook to hold a time slot
export function useHoldSlot() {
  const queryClient = useQueryClient();
  const [currentHold, setCurrentHold] = useState<BookingHold | null>(null);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
      }
    };
  }, [holdTimer]);

  const holdMutation = useMutation({
    mutationFn: async ({
      tenantId,
      staffId,
      serviceId,
      date,
      time,
      durationMinutes,
      clientId
    }: {
      tenantId: string;
      staffId: string;
      serviceId: string;
      date: string;
      time: string;
      durationMinutes: number;
      clientId?: string;
    }) => {
      const sessionId = getSessionId();
      return AvailabilityService.holdSlot(
        tenantId,
        sessionId,
        staffId,
        serviceId,
        date,
        time,
        durationMinutes,
        clientId
      );
    },
    onSuccess: (hold) => {
      setCurrentHold(hold);
      
      // Set timer to auto-release
      const timer = setTimeout(() => {
        if (hold.id) {
          releaseMutation.mutate(hold.id);
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      setHoldTimer(timer);
      
      // Invalidate availability queries
      queryClient.invalidateQueries({ 
        queryKey: ['available-slots', hold.tenant_id, hold.slot_date] 
      });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (holdId: string) => AvailabilityService.releaseSlot(holdId),
    onSuccess: () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }
      
      if (currentHold) {
        queryClient.invalidateQueries({ 
          queryKey: ['available-slots', currentHold.tenant_id, currentHold.slot_date] 
        });
      }
      
      setCurrentHold(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({
      holdId,
      clientData
    }: {
      holdId: string;
      clientData: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        notes?: string;
      };
    }) => {
      return AvailabilityService.confirmBooking(holdId, clientData);
    },
    onSuccess: (bookingId, variables) => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }
      
      if (currentHold) {
        queryClient.invalidateQueries({ 
          queryKey: ['available-slots', currentHold.tenant_id, currentHold.slot_date] 
        });
      }
      
      setCurrentHold(null);
    },
  });

  return {
    currentHold,
    holdSlot: holdMutation.mutate,
    releaseSlot: releaseMutation.mutate,
    confirmBooking: confirmMutation.mutate,
    isHolding: holdMutation.isPending,
    isReleasing: releaseMutation.isPending,
    isConfirming: confirmMutation.isPending,
    holdError: holdMutation.error,
    confirmError: confirmMutation.error,
  };
}

// Hook to get staff availability calendar
export function useStaffAvailability(
  tenantId: string,
  startDate: string,
  endDate: string,
  staffId?: string
) {
  const queryKey = ['staff-availability', tenantId, startDate, endDate, staffId];
  
  return useQuery({
    queryKey,
    queryFn: () => AvailabilityService.getStaffAvailability(tenantId, startDate, endDate, staffId),
    enabled: !!tenantId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for hold countdown
export function useHoldCountdown(expiresAt: string | null) {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingTime(0);
      return;
    }

    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      setRemainingTime(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return {
    remainingTime,
    minutes,
    seconds,
    isExpired: remainingTime === 0,
    formattedTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
  };
}