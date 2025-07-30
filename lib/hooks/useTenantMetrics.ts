'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface TenantMetrics {
  revenue_last30: number
  appointments_last30: number
  new_clients_last30: number
  low_stock_items: number
  avg_spend_per_client: number
  expected_revenue_current_month: number
  avg_transaction_value: number
}

export function useTenantMetrics() {
  const { tenantId } = useTenant()

  return useQuery<TenantMetrics | null>({
    queryKey: ['tenant_metrics', tenantId],
    enabled: !!tenantId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) return null
      console.log('[useTenantMetrics] Fetching tenant metrics for tenantId:', tenantId)

      // Probeer eerst de RPC; als dit 404 geeft (melding 'Failed to load resource'), val terug op de VIEW.
      let { data, error } = await supabase
        .rpc('tenant_metrics', { _tenant: tenantId })
        .maybeSingle()

      if (error && (error.message?.includes('404') || error.code === '404')) {
        console.warn('[useTenantMetrics] RPC niet gevonden, probeer view tenant_metrics_view')
        const viewRes = await (supabase as any)
          .from('tenant_metrics_view')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle()
        data = viewRes.data as any
        error = viewRes.error
      }

      if (error) {
        console.error('Supabase RPC tenant_metrics error:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        })
        // Return fallback data when RPC is not available
        return {
          revenue_last30: 0,
          appointments_last30: 0,
          new_clients_last30: 0,
          low_stock_items: 0,
          avg_spend_per_client: 0,
          expected_revenue_current_month: 0,
          avg_transaction_value: 0
        }
      }

      return data as TenantMetrics | null
    },
  })
} 