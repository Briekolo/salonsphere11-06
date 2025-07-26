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
    <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 rounded-2xl shadow-lg border border-emerald-100/50 p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-200/10 to-teal-200/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-green-200/10 to-emerald-200/10 rounded-full blur-xl"></div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent">Voorraadstatus</h2>
        <button 
          onClick={() => router.push('/inventory')}
          className="text-sm bg-gradient-to-r from-emerald-100/50 to-teal-100/50 text-emerald-600 hover:from-emerald-200/50 hover:to-teal-200/50 hover:text-emerald-700 px-3 py-2 rounded-full border border-emerald-200/30 font-medium transition-all duration-300"
        >
          Beheer voorraad
        </button>
      </div>

      <div className="relative z-10">
        {/* Low Stock Alert */}
        {isLoadingStock ? (
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
            <LowStockSkeleton />
          </div>
        ) : hasLowStockItems ? (
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">
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
                  <div key={item.id} className="space-y-2 hover:bg-white/50 rounded-xl p-2 -m-2 transition-all duration-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-800 font-semibold">{item.name}</span>
                      <span className={`text-sm font-bold ${
                        isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {item.current_stock} / {item.min_stock} {item.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${
                          isCritical ? 'bg-gradient-to-r from-red-400 to-red-500' : isLow ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-emerald-400 to-green-400'
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
          <div className="bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-200/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-900">
                Alle voorraadniveaus zijn goed
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10">
        {/* Recent Orders */}
        <div>
          <h3 className="text-sm font-bold text-emerald-700 mb-4 uppercase tracking-wider">
            Recente bestellingen
          </h3>

          {isLoadingOrders ? (
            <OrdersSkeleton />
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-emerald-500/70 text-center py-4 font-medium">
              Geen recente bestellingen gevonden.
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between hover:bg-white/50 rounded-xl p-3 -m-3 transition-all duration-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'delivered' 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' 
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700'
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
          className="w-full mt-6 bg-gradient-to-r from-emerald-400 to-teal-400 text-white px-4 py-3 rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Nieuwe bestelling
        </button>
      </div>
    </div>
  )
}