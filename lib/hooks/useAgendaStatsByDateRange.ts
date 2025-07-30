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
      console.log(`Booking ${b.id}: duration_minutes=${b.duration_minutes}, services.duration_minutes=${b.services?.duration_minutes}, using=${duration}`)
      return sum + duration
    }, 0)
    
    console.log(`Total bookings: ${bookings.length}, Total minutes: ${totalMinutes}`)

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