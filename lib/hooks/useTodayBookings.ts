'use client'

import { useBookings } from '@/lib/hooks/useBookings'
import { startOfDay, endOfDay } from 'date-fns'
import { useMemo } from 'react'

export function useTodayBookings() {
  // Bereken ISO timestamps voor vandaag (lokale tijd)
  const [startISO, endISO] = useMemo(() => {
    const now = new Date()
    return [startOfDay(now).toISOString(), endOfDay(now).toISOString()]
  }, [])

  return useBookings(startISO, endISO)
} 