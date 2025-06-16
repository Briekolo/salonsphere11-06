'use client'

import { useLowStockItems } from '@/lib/hooks/useInventoryItems'
import { useRecentPurchaseOrders } from '@/lib/hooks/usePurchaseOrders'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { AlertTriangle, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

function LowStockSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2 pl-6">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function InventoryStatus() {
  const router = useRouter()
  const { data: lowStockItems = [], isLoading: isLoadingStock } =
    useLowStockItems(5)
  const { data: recentOrders = [], isLoading: isLoadingOrders } =
    useRecentPurchaseOrders(3)

  const hasLowStockItems = lowStockItems.length > 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Voorraadstatus</h2>
        <button 
          onClick={() => router.push('/inventory')}
          className="text-sm text-primary-500 hover:text-primary-700"
        >
          Beheer voorraad
        </button>
      </div>

      {/* Low Stock Alert */}
      {isLoadingStock ? (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <LowStockSkeleton />
        </div>
      ) : hasLowStockItems ? (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              Producten met lage voorraad
            </span>
          </div>
          <div className="space-y-3">
            {lowStockItems.map(item => {
              const stockPercentage = item.min_stock > 0 
                ? (item.current_stock / item.min_stock) * 100 
                : 0
              const isLow = stockPercentage <= 50
              const isCritical = stockPercentage <= 20
              
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-800 font-medium">{item.name}</span>
                    <span className={`text-sm font-medium ${
                      isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {item.current_stock} / {item.min_stock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isCritical ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Alle voorraadniveaus zijn goed
            </span>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Recente bestellingen
        </h3>

        {isLoadingOrders ? (
          <OrdersSkeleton />
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Geen recente bestellingen gevonden.
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.supplier_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Besteld op{' '}
                    {format(new Date(order.created_at), 'd MMM', {
                      locale: nl,
                    })}
                  </p>
                </div>

                <span
                  className={`status-chip ${
                    order.status === 'delivered' ? 'delivered' : 'in-transit'
                  }`}
                >
                  {order.status === 'delivered' ? 'Geleverd' : 'Onderweg'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => router.push('/inventory')}
        className="w-full mt-6 btn-primary"
      >
        Nieuwe bestelling
      </button>
    </div>
  )
}