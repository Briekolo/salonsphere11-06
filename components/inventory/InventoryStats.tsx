'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react'

export function InventoryStats() {
  const { tenantId } = useTenant()

  const { data: metrics, isLoading } = useQuery<{
    totalProducts: number
    lowStockItems: number
    outOfStockItems: number
    ordersLast30: number
  } | null>({
    queryKey: ['inventory_stats', tenantId],
    queryFn: async () => {
      if (!tenantId) return null

      // 1. Alle voorraaditems ophalen (id, current_stock, min_stock)
      const { data: items, error: errItems } = await supabase
        .from('inventory_items')
        .select('id, current_stock, min_stock')
        .eq('tenant_id', tenantId)

      if (errItems) throw errItems

      const totalProducts = items?.length ?? 0
      let lowStockItems = 0
      let outOfStockItems = 0

      items?.forEach((item: any) => {
        if (item.current_stock === 0) {
          outOfStockItems++
        } else if (item.current_stock <= item.min_stock) {
          lowStockItems++
        }
      })

      // 2. Aantal bestellingen van de voorbije 30 dagen
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 30)

      const { count: ordersLast30, error: errOrders } = await supabase
        .from('supplier_pos')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('order_date', fromDate.toISOString())

      if (errOrders) throw errOrders

      return {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        ordersLast30: ordersLast30 ?? 0,
      }
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  })

  const stats = [
    {
      title: 'Totaal producten',
      value: isLoading || !metrics ? '–' : String(metrics.totalProducts),
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-icon-blue',
      iconBgColor: 'bg-icon-blue-bg'
    },
    {
      title: 'Lage voorraad',
      value: isLoading || !metrics ? '–' : String(metrics.lowStockItems),
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: 'text-icon-orange',
      iconBgColor: 'bg-icon-orange-bg'
    },
    {
      title: 'Uit voorraad',
      value: isLoading || !metrics ? '–' : String(metrics.outOfStockItems),
      icon: <TrendingDown className="w-5 h-5" />,
      iconColor: 'text-red-500',
      iconBgColor: 'bg-red-100'
    },
    {
      title: 'Bestellingen laatste 30 dagen',
      value: isLoading || !metrics ? '–' : String(metrics.ordersLast30),
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