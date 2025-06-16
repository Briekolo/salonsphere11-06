'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface PopularService {
  service_name: string
  total: number
  percentage: number
}

export function usePopularServices(from: Date, to: Date, limit = 5) {
  const { tenantId } = useTenant()

  return useQuery<PopularService[]>({
    queryKey: ['popular_services', tenantId, from.toISOString(), to.toISOString(), limit],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return []
      const { data, error } = await supabase.rpc('popular_services', {
        _tenant: tenantId,
        _from: from.toISOString().slice(0, 10),
        _to: to.toISOString().slice(0, 10),
        _limit: limit,
      })
      if (error) throw error
      return (data ?? []) as PopularService[]
    },
    staleTime: 1000 * 60,
  })
} 