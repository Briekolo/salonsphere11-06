'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface RevenuePoint {
  day: string // ISO date string
  revenue: number
}

export function useRevenueSeries(from: Date, to: Date) {
  const { tenantId } = useTenant()

  return useQuery<RevenuePoint[]>({
    queryKey: ['revenue_series', tenantId, from.toISOString(), to.toISOString()],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return []
      const { data, error } = await supabase.rpc('revenue_timeseries', {
        _tenant: tenantId,
        _from: from.toISOString().slice(0, 10),
        _to: to.toISOString().slice(0, 10),
      })
      if (error) throw error
      return data as RevenuePoint[]
    },
    staleTime: 1000 * 60, // 1 min
  })
} 