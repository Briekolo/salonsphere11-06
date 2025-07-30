'use client'

import { useTodayBookings } from '@/lib/hooks/useTodayBookings'
import { useMemo } from 'react'
import { Booking } from '@/lib/hooks/useBookings'

export function useAgendaStats() {
  const { data: rawBookings, isLoading } = useTodayBookings()

  const bookings = (rawBookings ?? []) as Booking[]

  const stats = useMemo(() => {
    const countToday = bookings.length

    const totalMinutes = bookings.reduce((sum, b) => {
      // Prioritize booking's duration_minutes over services.duration_minutes for custom durations
      const duration = (b.duration_minutes as number | null) ?? b.services?.duration_minutes ?? 0
      return sum + duration
    }, 0)

    const uniqueClients = new Set(bookings.map(b => b.client_id)).size

    const paidCount = bookings.filter(b => b.is_paid).length

    return { countToday, totalMinutes, uniqueClients, paidCount }
  }, [bookings])

  return { ...stats, isLoading }
} 