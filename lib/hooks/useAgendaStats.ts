'use client'

import { useTodayBookings } from '@/lib/hooks/useTodayBookings'
import { useMemo } from 'react'
import { Booking } from '@/lib/hooks/useBookings'

export function useAgendaStats() {
  const { data: rawBookings, isLoading } = useTodayBookings()

  const bookings = (rawBookings ?? []) as Booking[]

  const stats = useMemo(() => {
    const active = bookings.filter(b => b.status !== 'cancelled')

    const countToday = active.length

    const totalMinutes = active.reduce((sum, b) => {
      const duration = b.services?.duration_minutes ?? (b.duration_minutes as number | null) ?? 0
      return sum + duration
    }, 0)

    const uniqueClients = new Set(active.map(b => b.client_id)).size

    const completedCount = active.filter(b => b.status === 'completed').length

    return { countToday, totalMinutes, uniqueClients, completedCount }
  }, [bookings])

  return { ...stats, isLoading }
} 