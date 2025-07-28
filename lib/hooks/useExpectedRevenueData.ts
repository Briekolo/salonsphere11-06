'use client'

import { useQuery } from '@tanstack/react-query'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useTenant } from '@/lib/hooks/useTenant'
import { eachDayOfInterval, format } from 'date-fns'
import { Database } from '@/types/database'

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
  const supabase = createPagesBrowserClient<Database>()

  return useQuery<ExpectedRevenueDataPoint[]>({
    queryKey: ['expected-revenue-data-simple', tenantId, startDate, endDate],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return []

      // First get bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, scheduled_at, service_id')
        .eq('tenant_id', tenantId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

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

      // Group expected revenue by date
      const expectedByDate = new Map<string, { revenue: number; count: number }>()
      
      bookings.forEach(booking => {
        if (booking.service_id && booking.scheduled_at) {
          const date = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
          const price = servicePriceMap.get(booking.service_id) || 0
          const current = expectedByDate.get(date) || { revenue: 0, count: 0 }
          expectedByDate.set(date, {
            revenue: current.revenue + price,
            count: current.count + 1
          })
        }
      })

      // Fetch actual revenue data (paid invoices)
      const { data: actualData } = await supabase
        .from('invoices')
        .select('total_amount, issue_date')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .gte('issue_date', format(startDate, 'yyyy-MM-dd'))
        .lte('issue_date', format(endDate, 'yyyy-MM-dd'))

      // Group actual revenue by date
      const actualByDate = new Map<string, number>()
      
      actualData?.forEach(invoice => {
        if (invoice.issue_date) {
          const current = actualByDate.get(invoice.issue_date) || 0
          actualByDate.set(invoice.issue_date, current + Number(invoice.total_amount || 0))
        }
      })

      // Generate data points for each day in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      
      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const expected = expectedByDate.get(dateStr) || { revenue: 0, count: 0 }
        
        return {
          date: dateStr,
          expectedRevenue: expected.revenue,
          actualRevenue: actualByDate.get(dateStr) || 0,
          bookingsCount: expected.count
        }
      })
    }
  })
}