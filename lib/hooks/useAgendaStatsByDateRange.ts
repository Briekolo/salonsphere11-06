'use client'

import { useBookings } from '@/lib/hooks/useBookings'
import { useMemo } from 'react'
import { Booking } from '@/lib/hooks/useBookings'

export function useAgendaStatsByDateRange(startDate: string, endDate: string) {
  const { data: rawBookings, isLoading } = useBookings(startDate, endDate)

  const stats = useMemo(() => {
    const bookings = (rawBookings ?? []) as Booking[]

    const countTotal = bookings.length

    const totalMinutes = bookings.reduce((sum, b) => {
      // Prioritize booking's duration_minutes over services.duration_minutes for custom durations
      const duration = (b.duration_minutes as number | null) ?? b.services?.duration_minutes ?? 0
      return sum + duration
    }, 0)

    const uniqueClients = new Set(bookings.map(b => b.client_id)).size

    const paidCount = bookings.filter(b => b.is_paid).length
    const unpaidCount = bookings.filter(b => !b.is_paid).length

    return { 
      countTotal, 
      totalMinutes, 
      uniqueClients, 
      paidCount,
      unpaidCount
    }
  }, [rawBookings])

  return { ...stats, isLoading }
}