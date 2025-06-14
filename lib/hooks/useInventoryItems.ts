'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { InventoryService } from '@/lib/services/inventoryService'
import { Database } from '@/types/database'
import { useTenant } from '@/lib/hooks/useTenant'
import { supabase } from '@/lib/supabase'

// Supabase-afgeleide type
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']

// 1. Hoofdhook: lijst alle voorraaditems
export function useInventoryItems() {
  const { tenantId } = useTenant()

  return useQuery<InventoryItem[]>({
    queryKey: ['inventory_items', tenantId],
    queryFn: () => {
      if (!tenantId) return Promise.resolve([])
      return InventoryService.getAll(tenantId)
    },
    enabled: !!tenantId,
  })
}

// Hook voor lage voorraad-items
export function useLowStockItems(limit: number = 5) {
  const { tenantId } = useTenant()

  return useQuery<InventoryItem[]>({
    queryKey: ['inventory_items', tenantId, 'lowStock', limit],
    queryFn: async () => {
      if (!tenantId) return []

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('tenant_id', tenantId)
        .lte('current_stock', 5)
        .order('current_stock', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching low stock items:', error)
        throw error
      }
      return data || []
    },
    enabled: !!tenantId,
  })
}

// 2. Mutations -------------------------------------------------------------
export function useCreateInventoryItem() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (item: Omit<InventoryItem, 'id' | 'created_at' | 'tenant_id' | 'updated_at'>) => {
      if (!tenantId) throw new Error("Tenant ID not available for creating item.");
      return InventoryService.create(tenantId, item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
    },
  })
}

export function useUpdateInventoryItem() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      if (!tenantId) throw new Error("Tenant ID not available for updating item.");
      return InventoryService.update(tenantId, id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
    },
  })
}

export function useDeleteInventoryItem() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      if (!tenantId) throw new Error("Tenant ID not available for deleting item.");
      return InventoryService.delete(tenantId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
    },
  })
}

// Voorraad-aanpassing (bijv. bestelling binnen of gebruik in behandeling)
export function useAdjustInventoryStock() {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adjustment, reason }: { id:string; adjustment: number; reason: string }) => {
      if (!tenantId) throw new Error("Tenant ID not available for adjusting stock.");
      return InventoryService.adjustStock(tenantId, id, adjustment, reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['tenant_metrics_inv', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['tenant_metrics', tenantId] })
    },
  })
} 