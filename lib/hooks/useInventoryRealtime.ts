'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { useQueryClient } from '@tanstack/react-query'

export function useInventoryRealtime() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel('inventory_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // Invalidate list & detail queries
          queryClient.invalidateQueries({ queryKey: ['inventory_items', tenantId] })
          queryClient.invalidateQueries({ queryKey: ['tenant_metrics_inv', tenantId] })
          queryClient.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, queryClient])
} 