'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { useQueryClient } from '@tanstack/react-query'

export function useTenantRealtime() {
  const { tenantId } = useTenant()
  const qc = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const channel = supabase.channel('tenant_realtime_' + tenantId)

    const watch = (
      table: string,
      invalidate: () => void,
    ) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `tenant_id=eq.${tenantId}` },
        invalidate
      )
    }

    // mapping
    watch('inventory_items', () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', tenantId] })
      qc.invalidateQueries({ queryKey: ['tenant_metrics_inv', tenantId] })
      qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    })
    watch('product_history', () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', tenantId] })
      qc.invalidateQueries({ queryKey: ['tenant_metrics_inv', tenantId] })
    })
    watch('services', () => {
      qc.invalidateQueries({ queryKey: ['services', tenantId] })
      qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    })
    watch('bookings', () => {
      qc.invalidateQueries({ queryKey: ['bookings', tenantId] })
      qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    })
    watch('clients', () => {
      qc.invalidateQueries({ queryKey: ['clients', tenantId] })
    })
    watch('supplier_pos', () => {
      qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, qc])
} 