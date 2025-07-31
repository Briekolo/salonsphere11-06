'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStaffAuth } from './useStaffAuth';
import { AvailabilityService, StaffSchedule } from '@/lib/services/availabilityService';
import { WeekSchedule, ScheduleException } from '@/types/availability';

export function useStaffAvailability(staffId?: string) {
  const { user } = useStaffAuth();
  const queryClient = useQueryClient();
  const targetStaffId = staffId || user?.id;

  // Get current staff schedule
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['staff-schedule', targetStaffId],
    queryFn: () => AvailabilityService.getStaffSchedule(targetStaffId!, user!.tenant_id),
    enabled: !!targetStaffId && !!user?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert to week format for UI
  const weekSchedule: WeekSchedule | null = schedules 
    ? AvailabilityService.convertToWeekSchedule(schedules)
    : null;

  // Get legacy working hours as fallback
  const { data: legacyHours } = useQuery({
    queryKey: ['legacy-working-hours', targetStaffId],
    queryFn: () => AvailabilityService.getLegacyWorkingHours(targetStaffId!),
    enabled: !!targetStaffId && (!schedules || schedules.length === 0),
    staleTime: 5 * 60 * 1000,
  });

  // Get schedule exceptions
  const { data: exceptions, isLoading: exceptionsLoading } = useQuery({
    queryKey: ['schedule-exceptions', targetStaffId],
    queryFn: () => AvailabilityService.getScheduleExceptions(
      targetStaffId!,
      user!.tenant_id,
      // Get exceptions for next 3 months
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ),
    enabled: !!targetStaffId && !!user?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: (weekSchedule: WeekSchedule) => 
      AvailabilityService.updateStaffSchedule(targetStaffId!, user!.tenant_id, weekSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedule', targetStaffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
    },
    onError: (error) => {
      console.error('Error updating staff schedule:', error);
    }
  });

  // Create exception mutation
  const createExceptionMutation = useMutation({
    mutationFn: (exception: Omit<ScheduleException, 'id' | 'created_at'>) =>
      AvailabilityService.createScheduleException(exception),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-exceptions', targetStaffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
    },
    onError: (error) => {
      console.error('Error creating schedule exception:', error);
    }
  });

  // Update exception mutation
  const updateExceptionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ScheduleException> }) =>
      AvailabilityService.updateScheduleException(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-exceptions', targetStaffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
    },
    onError: (error) => {
      console.error('Error updating schedule exception:', error);
    }
  });

  // Delete exception mutation
  const deleteExceptionMutation = useMutation({
    mutationFn: (id: string) => AvailabilityService.deleteScheduleException(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-exceptions', targetStaffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
    },
    onError: (error) => {
      console.error('Error deleting schedule exception:', error);
    }
  });

  return {
    // Data
    schedules,
    weekSchedule: weekSchedule || legacyHours,
    exceptions: exceptions || [],
    
    // Loading states
    loading: schedulesLoading || exceptionsLoading,
    
    // Mutations
    updateSchedule: updateScheduleMutation.mutate,
    updateScheduleLoading: updateScheduleMutation.isPending,
    updateScheduleError: updateScheduleMutation.error,
    
    createException: createExceptionMutation.mutate,
    createExceptionLoading: createExceptionMutation.isPending,
    createExceptionError: createExceptionMutation.error,
    
    updateException: updateExceptionMutation.mutate,
    updateExceptionLoading: updateExceptionMutation.isPending,
    updateExceptionError: updateExceptionMutation.error,
    
    deleteException: deleteExceptionMutation.mutate,
    deleteExceptionLoading: deleteExceptionMutation.isPending,
    deleteExceptionError: deleteExceptionMutation.error,
  };
}

// Hook for checking staff availability on specific dates
export function useStaffAvailabilityCheck(staffId?: string) {
  const { user } = useStaffAuth();
  const targetStaffId = staffId || user?.id;

  const checkAvailability = async (date: string, startTime: string, endTime: string) => {
    if (!targetStaffId || !user?.tenant_id) return false;
    
    return AvailabilityService.isStaffAvailable(
      targetStaffId,
      user.tenant_id,
      date,
      startTime,
      endTime
    );
  };

  const getAvailableSlots = async (date: string, slotDuration: number = 30) => {
    if (!targetStaffId || !user?.tenant_id) return [];
    
    return AvailabilityService.getAvailableTimeSlots(
      targetStaffId,
      user.tenant_id,
      date,
      slotDuration
    );
  };

  return {
    checkAvailability,
    getAvailableSlots,
  };
}