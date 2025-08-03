'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Minus, Package, Calendar, User, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { InventoryService } from '@/lib/services/inventoryService'
import { useTenant } from '@/lib/hooks/useTenant'

interface ProductHistoryModalProps {
  productId: string
  onClose: () => void
}

export function ProductHistoryModal({ productId, onClose }: ProductHistoryModalProps) {
  const [timeFilter, setTimeFilter] = useState('all')

  const { tenantId } = useTenant()

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['inventory_item', tenantId, productId],
    queryFn: () => {
      if (!tenantId) return null
      return InventoryService.getById(tenantId, productId)
    },
    enabled: !!tenantId && !!productId,
  })
  
  const {
    data: history,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ['product_history', tenantId, productId],
    queryFn: () => {
      if (!tenantId) return Promise.resolve([])
      return InventoryService.getHistoryByProductId(tenantId, productId)
    },
    enabled: !!tenantId && !!productId,
  })

  const isLoading = isLoadingProduct || isLoadingHistory
  const hasError = !!historyError

  const getTypeIcon = (change: number) => {
    if (change > 0) return <Plus className="w-4 h-4 text-green-600" />
    if (change < 0) return <Minus className="w-4 h-4 text-red-600" />
    return <Package className="w-4 h-4 text-gray-600" />
  }

  const getTypeColor = (change: number) => {
    if (change > 0) return 'bg-green-50 border-green-200'
    if (change < 0) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  const getTypeText = (change: number) => {
    if (change > 0) return 'Toename'
    if (change < 0) return 'Afname'
    return 'Aanpassing'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Voorraadhistorie</h2>
            <p className="text-sm text-gray-600">{product?.name || 'Product laden...'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Periode:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Alle tijd</option>
              <option value="week">Deze week</option>
              <option value="month">Deze maand</option>
              <option value="quarter">Dit kwartaal</option>
            </select>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : hasError ? (
            <div className="text-center text-red-500">
              <p>Er is een fout opgetreden bij het laden van de historie.</p>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>Geen historie gevonden voor dit product.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className={`p-4 rounded-lg border ${getTypeColor(entry.change)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(entry.change)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getTypeText(entry.change)}: {entry.reason}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(entry.created_at), 'd MMM yyyy HH:mm', { locale: nl })}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry.user_id ? 'Gebruiker' : 'Systeem'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right font-medium text-gray-900">
                      {entry.change > 0 ? '+' : ''}{entry.change} {product?.unit || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full btn-outlined"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}