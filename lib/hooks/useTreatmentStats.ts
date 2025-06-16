'use client'

import { useMemo } from 'react'
import { useServices } from '@/lib/hooks/useServices'
import { useBookings } from '@/lib/hooks/useBookings'

export interface TreatmentStats {
  total: number
  avgDuration: number
  avgPrice: number
  popularName: string | null
  isLoading: boolean
}

export function useTreatmentStats(): TreatmentStats {
  const { data: services, isLoading: servicesLoading } = useServices()
  const { data: bookings, isLoading: bookingsLoading } = useBookings()

  const stats = useMemo(() => {
    if (servicesLoading || bookingsLoading) {
      return null
    }
    if (!services) {
      return {
        total: 0,
        avgDuration: 0,
        avgPrice: 0,
        popularName: null,
      }
    }

    const total = services.length
    const avgDuration = total
      ? services.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) / total
      : 0
    const avgPrice = total
      ? services.reduce((acc, s) => acc + (Number(s.price) ?? 0), 0) / total
      : 0

    // Popular treatment by booking count
    let popularName: string | null = null
    if (bookings && bookings.length > 0) {
      const countMap: Record<string, number> = {}
      bookings.forEach((b) => {
        if (b.service_id) {
          countMap[b.service_id] = (countMap[b.service_id] || 0) + 1
        }
      })
      const topServiceId = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0]
      if (topServiceId) {
        const service = services.find((s) => s.id === topServiceId)
        popularName = service?.name ?? null
      }
    }

    return {
      total,
      avgDuration,
      avgPrice,
      popularName,
    }
  }, [services, bookings])

  return {
    ...stats,
    isLoading: servicesLoading || bookingsLoading,
  }
} 