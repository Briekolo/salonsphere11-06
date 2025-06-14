'use client'

import { ShoppingCart, AlertTriangle } from 'lucide-react'
import { useLowStockItems } from '@/lib/hooks/useInventoryItems'

interface LowStockBannerProps {
  onNewOrder?: () => void
}

export function LowStockBanner({ onNewOrder }: LowStockBannerProps) {
  const { data: lowStockItems = [], isLoading } = useLowStockItems()

  if (isLoading || lowStockItems.length === 0) return null

  return (
    <div className="card bg-red-50 border-red-200">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-2">Voorraad waarschuwingen</h3>
          <p className="text-red-800 mb-3">
            Er zijn {lowStockItems.length} producten onder het minimum.
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((product) => (
              <span key={product.id} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {product.name} ({product.current_stock} {product.unit})
              </span>
            ))}
          </div>
        </div>
        {onNewOrder && (
          <button onClick={onNewOrder} className="btn-primary flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Bestelling plaatsen
          </button>
        )}
      </div>
    </div>
  )
} 