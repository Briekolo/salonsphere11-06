'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { useQueryClient } from '@tanstack/react-query'

export function useTenantRealtime() {
  const { tenantId } = useTenant()
  const qc = useQueryClient()

  useEffect(() => {
    if (!tenantId) {
      console.log('[useTenantRealtime] No tenantId, skipping realtime setup')
      return
    }

    console.log(`[useTenantRealtime] Setting up realtime for tenant: ${tenantId}`)
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
      qc.invalidateQueries({ queryKey: ['staff_bookings', tenantId] })
      qc.invalidateQueries({ queryKey: ['staff_todays_bookings', tenantId] })
      qc.invalidateQueries({ queryKey: ['staff_availability', tenantId] })
      qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    })
    watch('clients', () => {
      qc.invalidateQueries({ queryKey: ['clients', tenantId] })
    })
    watch('supplier_pos', () => {
      qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    })
    watch('staff_permissions', () => {
      qc.invalidateQueries({ queryKey: ['staff_permission', tenantId] })
      qc.invalidateQueries({ queryKey: ['staff_bookings', tenantId] })
      qc.invalidateQueries({ queryKey: ['staff_todays_bookings', tenantId] })
    })

    // Watch tenants table for salon profile updates
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${tenantId}` },
      () => {
        console.log('[useTenantRealtime] Tenant data updated, invalidating caches')
        // Invalidate all tenant-related queries
        qc.invalidateQueries({ queryKey: ['business-info', tenantId] })
        qc.invalidateQueries({ queryKey: ['tenant', tenantId] })
        qc.invalidateQueries({ queryKey: ['user-tenant'] })
        qc.invalidateQueries({ queryKey: ['tenant-resolver'] })
        qc.invalidateQueries({ queryKey: ['client-tenant-data', tenantId] })
        // Invalidate tenant metrics as they might depend on tenant data
        qc.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[useTenantRealtime] Successfully subscribed to realtime updates')
      } else if (status === 'CLOSED') {
        console.log('[useTenantRealtime] Realtime subscription closed')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[useTenantRealtime] Error subscribing to realtime updates')
      }
    })

    return () => {
      console.log('[useTenantRealtime] Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [tenantId, qc])
} 