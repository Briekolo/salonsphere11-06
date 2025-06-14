'use client'

import { useState, useMemo } from 'react'
import { Package, AlertTriangle, Edit, Plus, Minus, History, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useInventoryItems, useLowStockItems, InventoryItem } from '@/lib/hooks/useInventoryItems'
import { InventoryService } from '@/lib/services/inventoryService'

interface InventoryOverviewProps {
  onProductEdit: (productId: string) => void
  onStockAdjustment: (productId: string) => void
  onViewHistory: (productId: string) => void
  /**
   * Huidige zoekterm afkomstig van <InventoryFilters>.
   * Wordt gebruikt om producten client-side te filteren op naam, SKU en leverancier.
   */
  searchTerm: string
}

const getStatusInfo = (item: InventoryItem) => {
  const status = InventoryService.getStockStatus(item)
  switch (status) {
    case 'in-stock':
      return { text: 'Op voorraad', color: 'bg-green-100 text-green-800' }
    case 'low-stock':
      return { text: 'Lage voorraad', color: 'bg-yellow-100 text-yellow-800' }
    case 'out-of-stock':
      return { text: 'Uit voorraad', color: 'bg-red-100 text-red-800' }
    case 'critical':
      return { text: 'Kritiek', color: 'bg-red-100 text-red-800 animate-pulse' }
    default:
      return { text: 'Onbekend', color: 'bg-gray-100 text-gray-800' }
  }
}

const getStockBarProps = (item: InventoryItem) => {
  if (item.max_stock === 0) return { percentage: 0, color: 'bg-gray-200' }
  const percentage = (item.current_stock / item.max_stock) * 100
  const status = InventoryService.getStockStatus(item)
  let color = 'bg-green-500'
  if (status === 'critical') color = 'bg-red-600'
  else if (status === 'low-stock') color = 'bg-yellow-500'
else if (status === 'out-of-stock') color = 'bg-red-600'

  return {
    percentage: Math.min(percentage, 100),
    color,
  }
}

const LowStockAlert = ({ onNewOrder }: { onNewOrder: () => void }) => {
  const { data: lowStockItems = [], isLoading } = useLowStockItems()

  if (isLoading || lowStockItems.length === 0) {
    return null
  }

  return (
    <div className="card bg-red-50 border-red-200">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-2">Voorraad waarschuwingen</h3>
          <p className="text-red-800 mb-3">
            Er zijn {lowStockItems.length} producten die aandacht nodig hebben.
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((product) => (
              <span key={product.id} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {product.name} ({product.current_stock} {product.unit})
              </span>
            ))}
          </div>
        </div>
        <button onClick={onNewOrder} className="btn-primary flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Bestelling plaatsen
        </button>
      </div>
    </div>
  )
}

export function InventoryOverview({ onProductEdit, onStockAdjustment, onViewHistory, searchTerm }: InventoryOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const { data: products = [], isLoading } = useInventoryItems()

  const categories = useMemo(() => {
    if (!products) return []
    const categoryMap = products.reduce((acc, product) => {
      const category = product.category || 'Geen categorie'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category]++
      return acc
    }, {} as Record<string, number>)

    const result = Object.entries(categoryMap).map(([name, count]) => ({ name, count }))
    result.unshift({ name: 'Alle', count: products.length })
    return result
  }, [products])

  const filteredProducts = useMemo(() => {
    // Eerst filteren op categorie
    let base = products
    if (selectedCategory !== 'Alle') {
      base = base.filter((p) => (p.category || 'Geen categorie') === selectedCategory)
    }

    // Vervolgens filteren op zoekterm (case-insensitive)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      base = base.filter((p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku?.toLowerCase().includes(term) ?? false) ||
        (p.supplier?.toLowerCase().includes(term) ?? false)
      )
    }

    return base
  }, [products, selectedCategory, searchTerm])

  if (isLoading) {
    return <div className="card p-6 text-center">Voorraad overzicht laden...</div>
  }

  return (
    <div className="space-y-6">
      <LowStockAlert onNewOrder={() => console.log('New order modal')} />

      {/* Category Filter */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.name
                ? 'bg-[#02011F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              selectedCategory === category.name
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
         <div className="text-center py-12 card">
         <Package className="mx-auto h-12 w-12 text-gray-400" />
         <h3 className="mt-2 text-sm font-medium text-gray-900">Geen producten in deze categorie</h3>
         <p className="mt-1 text-sm text-gray-500">Selecteer een andere categorie of voeg een nieuw product toe.</p>
       </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const statusInfo = getStatusInfo(product)
          const stockBar = getStockBarProps(product)

          return (
            <div key={product.id} className="card group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`status-chip ${statusInfo.color}`}>{statusInfo.text}</span>
                  <button onClick={() => onProductEdit(product.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Huidige voorraad</span>
                  <span className="font-medium">{product.current_stock} {product.unit}</span>
                </div>
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-300 ${stockBar.color}`} style={{ width: `${stockBar.percentage}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Min: {product.min_stock}</span>
                    <span>Max: {product.max_stock}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Locatie:</span>
                    <div className="font-medium">{product.location}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Leverancier:</span>
                    <div className="font-medium">{product.supplier}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Kostprijs: </span>
                  <span className="font-medium">€{product.cost_per_unit.toFixed(2)} per {product.unit}</span>
                </div>
                <div className="text-xs text-gray-600">
                  Laatst bijgewerkt: {product.updated_at ? format(new Date(product.updated_at), 'd MMM yyyy', { locale: nl }) : '—'}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => onStockAdjustment(product.id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm">
                  <Plus className="w-4 h-4" />
                  Aanpassen
                </button>
                <button onClick={() => onViewHistory(product.id)} className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  <History className="w-4 h-4" />
                </button>
              </div>

              {InventoryService.getStockStatus(product) === 'critical' && (
                <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Kritieke voorraad!</span>
                  </div>
                  <p className="text-red-700 text-xs mt-1">Direct bijbestellen aanbevolen</p>
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}