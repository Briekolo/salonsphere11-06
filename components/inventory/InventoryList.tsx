'use client'

import { useState, useRef, useEffect } from 'react'
import { Package, Edit, Plus, History, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useInventoryItems, useDeleteInventoryItem, InventoryItem } from '@/lib/hooks/useInventoryItems'
import { InventoryService } from '@/lib/services/inventoryService'

interface InventoryListProps {
  onProductEdit: (productId: string) => void
  onStockAdjustment: (productId: string) => void
  onViewHistory: (productId: string) => void
  /** Zoekterm voor client-side filtering */
  searchTerm: string
}

export function InventoryList({ onProductEdit, onStockAdjustment, onViewHistory, searchTerm }: InventoryListProps) {
  const { data: rawProducts = [], isLoading } = useInventoryItems()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  
  const deleteMutation = useDeleteInventoryItem()

  // Client-side filtering op naam, sku of leverancier
  const products = rawProducts.filter((p) => {
    if (searchTerm.trim() === '') return true
    const term = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku?.toLowerCase().includes(term) ?? false) ||
      (p.supplier?.toLowerCase().includes(term) ?? false)
    )
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Weet je zeker dat je dit product wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      deleteMutation.mutate(id)
    }
    setOpenMenuId(null)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        return { text: 'Kritiek', color: 'bg-red-100 text-red-800' }
      default:
        return { text: 'Onbekend', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getStockLevel = (item: InventoryItem) => {
    if (item.max_stock === 0) return { percentage: 0, color: 'bg-gray-200' }
    const percentage = (item.current_stock / item.max_stock) * 100
    const status = InventoryService.getStockStatus(item)
    let color = 'bg-green-500'
    if (status === 'critical') color = 'bg-red-700'
    else if (status === 'low-stock' || status === 'out-of-stock') color = 'bg-yellow-500'

    return {
      percentage: Math.min(percentage, 100),
      color: color,
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6 text-center">
        <p>Voorraad laden...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Alle producten</h2>
        <div className="text-sm text-gray-600">
          {products.length} {products.length === 1 ? 'product' : 'producten'} gevonden
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Geen producten gevonden</h3>
          <p className="mt-1 text-sm text-gray-500">Voeg je eerste product toe om je voorraad te beheren.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => onProductEdit('')} // Assuming empty string opens a "new product" modal
              className="btn-primary"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Nieuw product
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="th-cell">Product</th>
                <th className="th-cell">SKU</th>
                <th className="th-cell">Categorie</th>
                <th className="th-cell">Huidige voorraad</th>
                <th className="th-cell">Min/Max</th>
                <th className="th-cell">Status</th>
                <th className="th-cell">Kostprijs</th>
                <th className="th-cell">Leverancier</th>
                <th className="th-cell">Laatste update</th>
                <th className="th-cell">Acties</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stockLevel = getStockLevel(product)
                const statusInfo = getStatusInfo(product)

                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="td-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {statusInfo.text === 'Kritiek' && (
                            <div className="flex items-center gap-1 text-red-600 text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              Kritiek niveau
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td-cell">
                      <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                    </td>
                    <td className="td-cell">
                      {product.category && (
                        <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      )}
                    </td>
                    <td className="td-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {product.current_stock} {product.unit}
                          </span>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${stockLevel.color}`}
                            style={{ width: `${stockLevel.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="td-cell">
                      <div className="text-sm text-gray-600">
                        <div>Min: {product.min_stock}</div>
                        <div>Max: {product.max_stock}</div>
                      </div>
                    </td>
                    <td className="td-cell">
                      <span className={`status-chip ${statusInfo.color}`}>{statusInfo.text}</span>
                    </td>
                    <td className="td-cell">
                      <span className="text-sm font-medium text-gray-900">
                        €{product.cost_per_unit.toFixed(2)}
                      </span>
                      <div className="text-xs text-gray-600">per {product.unit}</div>
                    </td>
                    <td className="td-cell">
                      <span className="text-sm text-gray-900">{product.supplier}</span>
                    </td>
                    <td className="td-cell">
                      <span className="text-sm text-gray-600">
                        {product.updated_at ? format(new Date(product.updated_at), 'd MMM yyyy', { locale: nl }) : '—'}
                      </span>
                    </td>
                    <td className="td-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onStockAdjustment(product.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Voorraad aanpassen"
                        >
                          <Plus className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => onProductEdit(product.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Product bewerken"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => onViewHistory(product.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Geschiedenis bekijken"
                        >
                          <History className="w-4 h-4 text-gray-500" />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {openMenuId === product.id && (
                            <div
                              ref={menuRef}
                              className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10"
                            >
                              <ul>
                                <li>
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Product verwijderen
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}