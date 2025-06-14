'use client'

import { useLowStockItems } from '@/lib/hooks/useInventoryItems'
import { useRecentPurchaseOrders } from '@/lib/hooks/usePurchaseOrders'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'

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
  const { data: lowStockItems = [], isLoading: isLoadingStock } =
    useLowStockItems(3)
  const { data: recentOrders = [], isLoading: isLoadingOrders } =
    useRecentPurchaseOrders(3)

  const hasLowStockItems = lowStockItems.length > 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Voorraadstatus</h2>
        <button className="text-sm text-primary-500 hover:text-primary-700">
          Beheer voorraad
        </button>
      </div>

      {/* Low Stock Alert */}
      {isLoadingStock ? (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <LowStockSkeleton />
        </div>
      ) : hasLowStockItems ? (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-900">
              Producten bijna op
            </span>
          </div>
          <div className="space-y-2">
            {lowStockItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-primary-800">{item.name}</span>
                <span className="text-primary-600 font-medium">
                  {item.current_stock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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

      <button className="w-full mt-6 btn-primary">Nieuwe bestelling</button>
    </div>
  )
}