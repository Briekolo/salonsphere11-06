'use client'

import { useBookings } from '@/lib/hooks/useBookings'
import { useMemo } from 'react'
import { Booking } from '@/lib/hooks/useBookings'

export function useAgendaStatsByDateRange(startDate: string, endDate: string) {
  const { data: rawBookings, isLoading } = useBookings(startDate, endDate)

  const stats = useMemo(() => {
    const bookings = (rawBookings ?? []) as Booking[]
    const active = bookings.filter(b => b.status !== 'cancelled')

    const countTotal = active.length

    const totalMinutes = active.reduce((sum, b) => {
      const duration = b.services?.duration_minutes ?? (b.duration_minutes as number | null) ?? 0
      return sum + duration
    }, 0)

    const uniqueClients = new Set(active.map(b => b.client_id)).size

    const completedCount = active.filter(b => b.status === 'completed').length
    const confirmedCount = active.filter(b => b.status === 'confirmed').length
    const scheduledCount = active.filter(b => b.status === 'scheduled').length
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

    return { 
      countTotal, 
      totalMinutes, 
      uniqueClients, 
      completedCount, 
      confirmedCount, 
      scheduledCount,
      cancelledCount 
    }
  }, [rawBookings])

  return { ...stats, isLoading }
}