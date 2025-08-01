'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useTenantRealtime() {
  const { tenantId } = useTenant()
  const qc = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const setupChannel = useCallback(() => {
    if (!tenantId) {
      console.log('[useTenantRealtime] No tenantId, skipping realtime setup')
      return null
    }

    console.log(`[useTenantRealtime] Setting up realtime for tenant: ${tenantId}`)
    const channel = supabase.channel('tenant_realtime_' + tenantId, {
      config: {
        presence: {
          key: tenantId
        }
      }
    })

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

    return channel
  }, [tenantId, qc])

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('[useTenantRealtime] Max reconnection attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff, max 30s
    console.log(`[useTenantRealtime] Attempting reconnection in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++
      
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      // Create new channel
      const newChannel = setupChannel()
      if (newChannel) {
        channelRef.current = newChannel
        subscribeToChannel(newChannel)
      }
    }, delay)
  }, [setupChannel])

  const subscribeToChannel = useCallback((channel: RealtimeChannel) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[useTenantRealtime] Successfully subscribed to realtime updates')
        reconnectAttemptsRef.current = 0 // Reset reconnection attempts on successful connection
        
        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      } else if (status === 'CLOSED') {
        console.log('[useTenantRealtime] Realtime subscription closed')
        attemptReconnect()
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[useTenantRealtime] Channel error, attempting reconnection')
        attemptReconnect()
      }
    })
  }, [attemptReconnect])

  useEffect(() => {
    const channel = setupChannel()
    if (channel) {
      channelRef.current = channel
      subscribeToChannel(channel)
    }

    return () => {
      console.log('[useTenantRealtime] Cleaning up realtime subscription')
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      // Reset reconnection attempts
      reconnectAttemptsRef.current = 0
    }
  }, [setupChannel, subscribeToChannel])
} 