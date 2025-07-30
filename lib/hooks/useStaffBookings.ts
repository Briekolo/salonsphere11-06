'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StaffBookingService, StaffBookingWithRelations } from '@/lib/services/staffBookingService'
import { Database } from '@/types/database'
import { useStaffAuth } from './useStaffAuth'
import { useTenant } from './useTenant'

type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

/**
 * Hook for fetching staff bookings with permission-based filtering
 */
export function useStaffBookings(staffId?: string, startDate?: string, endDate?: string) {
  const { user, isStaff } = useStaffAuth()
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['staff_bookings', tenantId, staffId || user?.id, startDate, endDate],
    queryFn: () => StaffBookingService.getStaffBookings(staffId, startDate, endDate),
    enabled: isStaff && !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching today's bookings for staff
 */
export function useStaffTodaysBookings(staffId?: string) {
  const { user, isStaff } = useStaffAuth()
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['staff_todays_bookings', tenantId, staffId || user?.id],
    queryFn: () => StaffBookingService.getTodaysBookings(staffId),
    enabled: isStaff && !!tenantId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes for today's bookings
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for fetching bookings by date range
 */
export function useStaffBookingsByDateRange(startDate: string, endDate: string, staffId?: string) {
  const { user, isStaff } = useStaffAuth()
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['staff_bookings_range', tenantId, staffId || user?.id, startDate, endDate],
    queryFn: () => StaffBookingService.getBookingsByDateRange(startDate, endDate, staffId),
    enabled: isStaff && !!tenantId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single booking by ID
 */
export function useStaffBooking(bookingId: string) {
  const { isStaff } = useStaffAuth()
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['staff_booking', tenantId, bookingId],
    queryFn: () => StaffBookingService.getBookingById(bookingId),
    enabled: isStaff && !!tenantId && !!bookingId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching staff availability
 */
export function useStaffAvailability(staffId: string, startDate: string, endDate: string) {
  const { isStaff } = useStaffAuth()
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['staff_availability', tenantId, staffId, startDate, endDate],
    queryFn: () => StaffBookingService.getStaffAvailability(staffId, startDate, endDate),
    enabled: isStaff && !!tenantId && !!staffId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for checking staff permissions
 */
export function useStaffPermission(permission: string, staffId?: string) {
  const { user, isStaff } = useStaffAuth()
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['staff_permission', tenantId, staffId || user?.id, permission],
    queryFn: () => StaffBookingService.hasPermission(permission as any, staffId),
    enabled: isStaff && !!tenantId && !!permission,
    staleTime: 1000 * 60 * 15, // 15 minutes - permissions don't change often
  })
}

/**
 * Mutation hook for creating bookings
 */
export function useCreateStaffBooking() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: (booking: Omit<BookingInsert, 'tenant_id'>) => 
      StaffBookingService.createBooking(booking),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['staff_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_todays_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_availability', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] }) // Also invalidate main bookings
      queryClient.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
      
      // Optimistically update the booking in cache if we can determine the query key
      const today = new Date().toISOString().split('T')[0]
      if (data.scheduled_at && data.scheduled_at.startsWith(today)) {
        queryClient.setQueryData(['staff_todays_bookings', tenantId, data.staff_id], (old: StaffBookingWithRelations[] | undefined) => {
          if (!old) return [data]
          return [...old, data].sort((a, b) => 
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          )
        })
      }
    },
    onError: (error) => {
      console.error('Failed to create booking:', error)
    }
  })
}

/**
 * Mutation hook for updating bookings
 */
export function useUpdateStaffBooking() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: ({ bookingId, updates }: { bookingId: string; updates: BookingUpdate }) =>
      StaffBookingService.updateBooking(bookingId, updates),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['staff_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_todays_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_booking', tenantId, variables.bookingId] })
      queryClient.invalidateQueries({ queryKey: ['staff_availability', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] }) // Also invalidate main bookings
      queryClient.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })

      // Update specific booking in cache
      queryClient.setQueryData(['staff_booking', tenantId, variables.bookingId], data)
    },
    onError: (error) => {
      console.error('Failed to update booking:', error)
    }
  })
}

/**
 * Mutation hook for deleting bookings
 */
export function useDeleteStaffBooking() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: (bookingId: string) => StaffBookingService.deleteBooking(bookingId),
    onSuccess: (_, bookingId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['staff_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_todays_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_availability', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] }) // Also invalidate main bookings
      queryClient.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })

      // Remove from cache
      queryClient.removeQueries({ queryKey: ['staff_booking', tenantId, bookingId] })
      
      // Remove from lists optimistically
      queryClient.setQueryData(['staff_todays_bookings', tenantId], (old: StaffBookingWithRelations[] | undefined) => {
        if (!old) return []
        return old.filter(booking => booking.id !== bookingId)
      })
    },
    onError: (error) => {
      console.error('Failed to delete booking:', error)
    }
  })
}

/**
 * Mutation hook for adding notes to bookings
 */
export function useAddStaffBookingNotes() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: ({ bookingId, notes, isInternal = false }: { 
      bookingId: string; 
      notes: string; 
      isInternal?: boolean 
    }) => StaffBookingService.addNotes(bookingId, notes, isInternal),
    onSuccess: (data, variables) => {
      // Update specific booking in cache
      queryClient.setQueryData(['staff_booking', tenantId, variables.bookingId], data)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['staff_bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['staff_todays_bookings', tenantId] })
    },
    onError: (error) => {
      console.error('Failed to add notes:', error)
    }
  })
}

/**
 * Combined hook for staff booking operations
 * Returns all the necessary queries and mutations for staff booking management
 */
export function useStaffBookingOperations() {
  const createBooking = useCreateStaffBooking()
  const updateBooking = useUpdateStaffBooking()
  const deleteBooking = useDeleteStaffBooking()
  const addNotes = useAddStaffBookingNotes()

  return {
    create: createBooking,
    update: updateBooking,
    delete: deleteBooking,
    addNotes,
    isLoading: createBooking.isPending || updateBooking.isPending || deleteBooking.isPending || addNotes.isPending,
    isError: createBooking.isError || updateBooking.isError || deleteBooking.isError || addNotes.isError,
  }
}