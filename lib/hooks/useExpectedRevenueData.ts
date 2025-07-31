'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { eachDayOfInterval, format } from 'date-fns'

interface UseExpectedRevenueDataParams {
  startDate: Date
  endDate: Date
}

interface ExpectedRevenueDataPoint {
  date: string
  expectedRevenue: number
  actualRevenue: number
  bookingsCount: number
}

export function useExpectedRevenueData({ startDate, endDate }: UseExpectedRevenueDataParams) {
  const { tenantId } = useTenant()

  return useQuery<ExpectedRevenueDataPoint[]>({
    queryKey: ['expected-revenue-data-simple', tenantId, startDate.toISOString(), endDate.toISOString()],
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes in memory (renamed from cacheTime)
    queryFn: async () => {
      if (!tenantId) return []

      console.log('[useExpectedRevenueData] Fetching data for:', {
        tenantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      // Get all bookings in the date range (both paid and unpaid for future dates)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, scheduled_at, service_id, is_paid')
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

      console.log('[useExpectedRevenueData] Bookings query result:', { 
        bookings: bookings?.length || 0, 
        error: bookingsError 
      })

      if (bookingsError || !bookings) {
        console.error('Error fetching bookings:', bookingsError)
        return []
      }

      // Get unique service IDs
      const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))]
      
      if (serviceIds.length === 0) {
        return []
      }

      // Fetch services separately
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, price')
        .in('id', serviceIds)

      if (servicesError || !services) {
        console.error('Error fetching services:', servicesError)
        return []
      }

      // Create a map of service prices
      const servicePriceMap = new Map(
        services.map(s => [s.id, Number(s.price) || 0])
      )

      // Group revenue by date - separate paid and unpaid bookings
      const expectedByDate = new Map<string, { revenue: number; count: number }>()
      const actualFutureByDate = new Map<string, number>()
      
      bookings.forEach(booking => {
        if (booking.service_id && booking.scheduled_at) {
          const date = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
          const price = servicePriceMap.get(booking.service_id) || 0
          
          if (booking.is_paid) {
            // This is actual revenue from paid future bookings
            const current = actualFutureByDate.get(date) || 0
            actualFutureByDate.set(date, current + price)
          } else {
            // This is expected revenue from unpaid bookings
            const current = expectedByDate.get(date) || { revenue: 0, count: 0 }
            expectedByDate.set(date, {
              revenue: current.revenue + price,
              count: current.count + 1
            })
          }
        }
      })

      // Generate data points for each day in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      
      const result = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const expected = expectedByDate.get(dateStr) || { revenue: 0, count: 0 }
        const actualRevenue = actualFutureByDate.get(dateStr) || 0
        
        return {
          date: dateStr,
          expectedRevenue: expected.revenue,
          actualRevenue: actualRevenue, // Only paid future bookings count as actual revenue
          bookingsCount: expected.count
        }
      })

      console.log('[useExpectedRevenueData] Final result:', {
        totalDays: result.length,
        daysWithRevenue: result.filter(d => d.expectedRevenue > 0).length,
        totalExpectedRevenue: result.reduce((sum, d) => sum + d.expectedRevenue, 0)
      })

      return result
    }
  })
}