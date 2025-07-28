'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookingService } from '@/lib/services/bookingService'
import { Database } from '@/types/database'
import { useTenant } from '@/lib/hooks/useTenant'
import { useMemo } from 'react'

export type Booking = Database['public']['Tables']['bookings']['Row'] & {
  clients?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  }
  services?: {
    name: string | null
    duration_minutes: number | null
    price: number | null
  }
  users?: {
    first_name: string | null
    last_name: string | null
  }
  user_id?: string | null
}

export function useBookings(startDate?: string, endDate?: string, enabled: boolean = true) {
  const { tenantId } = useTenant()

  const queryKey = useMemo(
    () => ['bookings', tenantId, startDate, endDate],
    [tenantId, startDate, endDate]
  )

  const query = useQuery<Booking[]>({
    queryKey,
    enabled: !!tenantId && enabled,
    queryFn: () => {
      if (!tenantId) return Promise.resolve([])
      if (startDate && endDate) return BookingService.getByDateRange(startDate, endDate)
      return BookingService.getAll()
    },
    staleTime: 1000 * 60, // 1 min: considered fresh for 1 minuut
    // @ts-ignore
    keepPreviousData: true, // behoud vorige data tijdens nieuwe fetches
    refetchOnWindowFocus: false, // voorkom refetch bij focus om flikkeren te beperken
  })

  // Realtime updates worden nu centraal afgehandeld in `useTenantRealtime`.

  return query
}

export function useBooking(bookingId: string | null) {
  const { tenantId } = useTenant()

return useQuery<Booking | null>({
  queryKey: ['booking', tenantId, bookingId],
    queryFn: async () => {
      if (!tenantId || !bookingId) return null
      return BookingService.getById(bookingId)
    },
    enabled: !!tenantId && !!bookingId,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: BookingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-paginated'] })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      console.log('Mutation function called:', { id, updates })
      return BookingService.update(id, updates as any)
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['bookings'] })
      await queryClient.cancelQueries({ queryKey: ['booking', tenantId, id] })
      
      // Snapshot the previous values
      const previousBookings = queryClient.getQueriesData({ queryKey: ['bookings'] })
      const previousBooking = queryClient.getQueryData(['booking', tenantId, id])
      
      // Optimistically update all booking list queries
      queryClient.setQueriesData<Booking[]>({ queryKey: ['bookings'] }, (old) => {
        if (!old) return old
        return old.map(booking => 
          booking.id === id ? { ...booking, ...updates } : booking
        )
      })
      
      // Optimistically update the specific booking query
      queryClient.setQueryData<Booking>(['booking', tenantId, id], (old) => {
        if (!old) return old
        return { ...old, ...updates }
      })
      
      console.log('Optimistic update applied for booking:', id)
      
      // Return a context with the previous values
      return { previousBookings, previousBooking, bookingId: id }
    },
    onSuccess: (data, variables) => {
      console.log('Mutation success:', { data, variables })
      // Invalidate and refetch to ensure server state is correct
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['booking', tenantId, variables.id] })
    },
    onError: (error, variables, context) => {
      console.error('Mutation error:', { error, variables })
      // Rollback the optimistic updates
      if (context?.previousBookings) {
        context.previousBookings.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      // Rollback the specific booking query
      if (context?.previousBooking && context?.bookingId) {
        queryClient.setQueryData(['booking', tenantId, context.bookingId], context.previousBooking)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['booking', tenantId, variables.id] })
    },
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => BookingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-paginated'] })
    },
  })
}

export function usePaginatedBookings(enabled: boolean = true) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['bookings-paginated', tenantId],
    enabled: !!tenantId && enabled,
    queryFn: async () => {
      if (!tenantId) return { bookings: [], futureHasMore: false, pastHasMore: false }
      
      // Load only the next 5 appointments
      const result = await BookingService.getPaginated({ 
        direction: 'future', 
        limit: 5 
      })

      return {
        bookings: result.data,
        futureHasMore: result.hasMore,
        futureCursor: result.nextCursor,
        pastHasMore: true, // Always assume there might be past appointments initially
        pastCursor: result.data.length > 0 ? result.data[0].scheduled_at : new Date().toISOString()
      }
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  })
}

export function useLoadMoreBookings() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async ({ direction, cursor }: { direction: 'future' | 'past', cursor?: string }) => {
      return BookingService.getPaginated({ 
        direction, 
        cursor, 
        limit: 5 
      })
    },
    onSuccess: (newData, { direction }) => {
      queryClient.setQueryData(['bookings-paginated', tenantId], (oldData: any) => {
        if (!oldData) return oldData

        // Create a map of existing booking IDs for deduplication
        const existingIds = new Set(oldData.bookings.map((b: Booking) => b.id))
        
        // Filter out any duplicates from new data
        const uniqueNewData = newData.data.filter((b: Booking) => !existingIds.has(b.id))

        if (direction === 'future') {
          return {
            ...oldData,
            bookings: [...oldData.bookings, ...uniqueNewData].sort(
              (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            ),
            futureHasMore: newData.hasMore,
            futureCursor: newData.nextCursor || oldData.futureCursor
          }
        } else {
          return {
            ...oldData,
            bookings: [...uniqueNewData, ...oldData.bookings].sort(
              (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            ),
            pastHasMore: newData.hasMore,
            pastCursor: uniqueNewData.length > 0 ? uniqueNewData[0].scheduled_at : oldData.pastCursor
          }
        }
      })
    }
  })
} 