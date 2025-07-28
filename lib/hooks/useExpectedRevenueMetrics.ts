'use client'

import { useQuery } from '@tanstack/react-query'
import { ExpectedRevenueService } from '@/lib/services/expectedRevenueService'
import { useTenant } from '@/lib/hooks/useTenant'

export function useExpectedRevenueMetrics() {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['expected-revenue-metrics', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) {
        return {
          totalExpected: 0,
          weeklyExpected: 0,
          monthlyExpected: 0,
          bookingsCount: 0,
          averageBookingValue: 0
        }
      }
      
      return ExpectedRevenueService.getMetrics(tenantId)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5 // Refetch every 5 minutes
  })
}