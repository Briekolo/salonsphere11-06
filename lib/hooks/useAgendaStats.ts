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
      const duration = b.services?.duration_minutes ?? (b.duration_minutes as number | null) ?? 0
      return sum + duration
    }, 0)

    const uniqueClients = new Set(bookings.map(b => b.client_id)).size

    const paidCount = bookings.filter(b => b.is_paid).length

    return { countToday, totalMinutes, uniqueClients, paidCount }
  }, [bookings])

  return { ...stats, isLoading }
} 