'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { Database } from '@/types/database'

export type PurchaseOrder = Database['public']['Tables']['supplier_pos']['Row']

export function useRecentPurchaseOrders(limit: number = 3) {
  const { tenantId } = useTenant()

  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase_orders', tenantId, 'recent', limit],
    queryFn: async () => {
      if (!tenantId) return []

      const { data, error } = await supabase
        .from('supplier_pos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('order_date', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent purchase orders:', error)
        throw error
      }
      return data || []
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minuten
  })
} 