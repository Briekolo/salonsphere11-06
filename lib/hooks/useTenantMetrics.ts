'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface TenantMetrics {
  tenant_id: string
  revenue_last30: number
  appointments_last30: number
  new_clients_last30: number
  low_stock_items: number
  avg_spend_per_client: number
}

export function useTenantMetrics() {
  const { tenantId } = useTenant()

  return useQuery<TenantMetrics | null>({
    queryKey: ['tenant_metrics', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null
      const { data, error } = await supabase.rpc('tenant_metrics', { _tenant: tenantId })
      if (error) throw error
      return data as TenantMetrics
    },
    staleTime: 1000 * 60, // 1 min
  })
} 