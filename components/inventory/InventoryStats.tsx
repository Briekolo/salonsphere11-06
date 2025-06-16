'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react'

export function InventoryStats() {
  const { tenantId } = useTenant()

  interface InventoryMetrics {
    total_products: number
    low_stock_items: number
    out_of_stock_items: number
    orders_last30: number
  }

  const { data: metrics, isLoading } = useQuery<InventoryMetrics | null>({
    queryKey: ['inventory_stats', tenantId],
    enabled: !!tenantId,
    staleTime: 60_000,
    queryFn: async (): Promise<InventoryMetrics | null> => {
      if (!tenantId) return null

      // Eén enkele RPC-call die alle aggregaties server-side afhandelt
      const { data, error } = await (supabase as any).rpc('get_inventory_stats', {
        _tenant: tenantId,
      }).single()

      if (error) throw error

      return data as InventoryMetrics
    },
  })

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className="flex items-start justify-between">
            <div className={`metric-icon ${stat.iconBgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
          <div className="mt-4">
            <p className="metric-title">{stat.title}</p>
            <p className="metric-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}