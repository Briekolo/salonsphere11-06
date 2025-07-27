'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { useMemo } from 'react'

export interface RevenuePoint {
  day: string // ISO date string
  revenue: number
}

export function useRevenueSeries(from: Date, to: Date) {
  const { tenantId } = useTenant()

  const fromIso = useMemo(() => from.toISOString().slice(0, 10), [from])
  const toIso = useMemo(() => to.toISOString().slice(0, 10), [to])

  return useQuery<RevenuePoint[]>({
    queryKey: ['revenue_series', tenantId, fromIso, toIso],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return []
      const { data, error } = await supabase.rpc('revenue_timeseries', {
        _tenant: tenantId,
        _from: from.toISOString().slice(0, 10),
        _to: to.toISOString().slice(0, 10),
      })
      
      if (error) {
        console.error('Revenue timeseries RPC error:', error)
        // Try direct query as fallback
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('paid_at, total_amount')
          .eq('tenant_id', tenantId)
          .eq('status', 'paid')
          .not('paid_at', 'is', null)
          .gte('paid_at', fromIso)
          .lte('paid_at', toIso)
          .order('paid_at', { ascending: true })
        
        if (invoiceError) {
          console.error('Invoice query error:', invoiceError)
          return []
        }
        
        // Group by day
        const revenueByDay = new Map<string, number>()
        invoiceData?.forEach(invoice => {
          const day = invoice.paid_at.split('T')[0]
          const current = revenueByDay.get(day) || 0
          revenueByDay.set(day, current + (invoice.total_amount || 0))
        })
        
        // Convert to RevenuePoint array
        return Array.from(revenueByDay.entries()).map(([day, revenue]) => ({
          day,
          revenue
        }))
      }
      
      return data as RevenuePoint[]
    },
    staleTime: 1000 * 60, // 1 min
  })
} 