'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { useInventoryItems } from '@/lib/hooks/useInventoryItems'
import { Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'

export function InventoryStats() {
  const { tenantId } = useTenant()
  const { data: inventoryItems, isLoading: itemsLoading } = useInventoryItems()

  interface InventoryMetrics {
    total_products: number
    low_stock_items: number
    out_of_stock_items: number
    orders_last30: number
  }

  // Try RPC first, fallback to client-side calculation
  const { data: rpcMetrics, isLoading: rpcLoading } = useQuery<InventoryMetrics | null>({
    queryKey: ['inventory_stats_rpc', tenantId],
    enabled: !!tenantId,
    staleTime: 60_000,
    retry: false, // Don't retry if RPC fails
    queryFn: async (): Promise<InventoryMetrics | null> => {
      if (!tenantId) return null

      try {
        const { data, error } = await (supabase as any).rpc('get_inventory_stats', {
          _tenant: tenantId,
        }).single()

        if (error) throw error
        return data as InventoryMetrics
      } catch (error) {
        console.warn('RPC get_inventory_stats failed, falling back to client-side calculation:', error)
        return null
      }
    },
  })

  // Client-side calculation as fallback
  const clientMetrics = useMemo((): InventoryMetrics | null => {
    if (!inventoryItems) return null

    return {
      total_products: inventoryItems.length,
      low_stock_items: inventoryItems.filter(item => item.current_stock <= item.min_stock).length,
      out_of_stock_items: inventoryItems.filter(item => item.current_stock === 0).length,
      orders_last30: 0 // Placeholder - no order system yet
    }
  }, [inventoryItems])

  // Use RPC data if available, otherwise use client-side calculation
  const metrics = rpcMetrics || clientMetrics
  const isLoading = rpcLoading || itemsLoading

  const stats = [
    {
      title: 'Totaal producten',
      value: isLoading || !metrics ? '–' : String(metrics.total_products),
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Lage voorraad',
      value: isLoading || !metrics ? '–' : String(metrics.low_stock_items),
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    },
    {
      title: 'Uit voorraad',
      value: isLoading || !metrics ? '–' : String(metrics.out_of_stock_items),
      icon: <TrendingDown className="w-5 h-5" />,
      iconColor: 'text-red-500',
      iconBgColor: 'bg-red-100'
    },
    {
      title: 'Bestellingen laatste 30 dagen',
      value: isLoading || !metrics ? '–' : String(metrics.orders_last30),
      icon: <ShoppingCart className="w-5 h-5" />,
      iconColor: 'text-icon-green',
      iconBgColor: 'bg-icon-green-bg'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card p-3 sm:p-4">
          <div className="flex items-start justify-between">
            <div className={`metric-icon w-10 h-10 sm:w-12 sm:h-12 ${stat.iconBgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="metric-title text-xs sm:text-sm">{stat.title}</p>
            <p className="metric-value text-lg sm:text-2xl">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}