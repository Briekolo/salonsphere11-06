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

export function useBookings(startDate?: string, endDate?: string) {
  const { tenantId } = useTenant()

  const queryKey = useMemo(
    () => ['bookings', tenantId, startDate, endDate],
    [tenantId, startDate, endDate]
  )

  const query = useQuery<Booking[]>({
    queryKey,
    enabled: !!tenantId,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
      BookingService.update(id, updates as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => BookingService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
} 