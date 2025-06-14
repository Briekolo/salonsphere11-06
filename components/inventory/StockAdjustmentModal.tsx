'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Minus, Package, AlertTriangle, Loader2 } from 'lucide-react'
import { InventoryService } from '@/lib/services/inventoryService'
import { useAdjustInventoryStock } from '@/lib/hooks/useInventoryItems'
import { useTenant } from '@/lib/hooks/useTenant'

interface StockAdjustmentModalProps {
  productId: string
  onClose: () => void
}

export function StockAdjustmentModal({ productId, onClose }: StockAdjustmentModalProps) {
  const { tenantId } = useTenant()
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')

  const { data: product, isLoading } = useQuery({
    queryKey: ['inventory_item_for_adjustment', productId, tenantId],
    queryFn: () => {
      if (!tenantId) return null
      return InventoryService.getById(tenantId, productId)
    },
    enabled: !!productId && !!tenantId,
  })
  
  const adjustStockMutation = useAdjustInventoryStock()

  const calculateNewStock = () => {
    if (!product) return 0
    switch (adjustmentType) {
      case 'add':
        return product.current_stock + quantity
      case 'remove':
        return Math.max(0, product.current_stock - quantity)
      case 'set':
        return quantity
      default:
        return product.current_stock
    }
  }

  const newStock = calculateNewStock()
  const isLowStock = product ? newStock <= product.min_stock : false
  const isOverStock = product ? newStock > product.max_stock : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !reason) return

    let adjustment = quantity
    if (adjustmentType === 'remove') {
      adjustment = -quantity
    } else if (adjustmentType === 'set') {
      adjustment = quantity - product.current_stock
    }

    await adjustStockMutation.mutateAsync({
      id: productId,
      adjustment,
      reason,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Voorraad aanpassen</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : !product ? (
          <div className="p-6 text-center text-gray-600">
            Product niet gevonden.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contents">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    Huidige voorraad: {product.current_stock} {product.unit}
                  </p>
                </div>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type aanpassing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      adjustmentType === 'add'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Toevoegen
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('remove')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      adjustmentType === 'remove'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    Verwijderen
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('set')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      adjustmentType === 'set'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Instellen
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {adjustmentType === 'set' ? 'Nieuwe voorraad' : 'Aantal'}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              {/* New Stock Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Nieuwe voorraad:</span>
                  <span className={`font-medium ${
                    isLowStock ? 'text-red-600' : isOverStock ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {newStock} {product.unit}
                  </span>
                </div>
                
                {(isLowStock || isOverStock) && (
                  <div className={`flex items-center gap-2 text-sm ${
                    isLowStock ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                    {isLowStock ? 'Onder minimale voorraad' : 'Boven maximale voorraad'}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reden *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecteer reden</option>
                  <option value="Levering ontvangen">Levering ontvangen</option>
                  <option value="Verbruik behandeling">Verbruik behandeling</option>
                  <option value="Beschadigd/verlopen">Beschadigd/verlopen</option>
                  <option value="Diefstal/verlies">Diefstal/verlies</option>
                  <option value="Correctie telling">Correctie telling</option>
                  <option value="Retour leverancier">Retour leverancier</option>
                  <option value="Overig">Overig</option>
                </select>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-outlined"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={adjustStockMutation.isPending}
                className="flex-1 btn-primary"
              >
                {adjustStockMutation.isPending ? 'Opslaan...' : 'Aanpassing opslaan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}