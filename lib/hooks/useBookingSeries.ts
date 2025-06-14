'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface BookingPoint {
  day: string
  bookings: number
}

export function useBookingSeries(from: Date, to: Date) {
  const { tenantId } = useTenant()

  return useQuery<BookingPoint[]>({
    queryKey: ['booking_series', tenantId, from.toISOString(), to.toISOString()],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return []
      const { data, error } = await supabase.rpc('bookings_timeseries', {
        _tenant: tenantId,
        _from: from.toISOString().slice(0, 10),
        _to: to.toISOString().slice(0, 10),
      })
      if (error) throw error
      return data as BookingPoint[]
    },
    staleTime: 1000 * 60,
  })
} 