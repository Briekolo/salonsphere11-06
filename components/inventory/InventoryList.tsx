'use client'

import { Package, Edit, Plus, History, AlertTriangle, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface Product {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  costPerUnit: number
  supplier: string
  lastUpdated: Date
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'critical'
  sku: string
  location: string
}

interface InventoryListProps {
  onProductEdit: (productId: string) => void
  onStockAdjustment: (productId: string) => void
  onViewHistory: (productId: string) => void
}

const products: Product[] = [
  {
    id: '1',
    name: 'OPI Base Coat',
    category: 'Nagelverzorging',
    currentStock: 8,
    minStock: 5,
    maxStock: 20,
    unit: 'stuks',
    costPerUnit: 12.50,
    supplier: 'OPI',
    lastUpdated: new Date('2024-01-15'),
    status: 'in-stock',
    sku: 'OPI-BC-001',
    location: 'Rek A1'
  },
  {
    id: '2',
    name: 'Essie Nagellak Rood',
    category: 'Nagelverzorging',
    currentStock: 2,
    minStock: 5,
    maxStock: 15,
    unit: 'stuks',
    costPerUnit: 8.95,
    supplier: 'Essie',
    lastUpdated: new Date('2024-01-14'),
    status: 'low-stock',
    sku: 'ESS-NL-RED',
    location: 'Rek A2'
  },
  {
    id: '3',
    name: 'CND Top Coat',
    category: 'Nagelverzorging',
    currentStock: 0,
    minStock: 3,
    maxStock: 12,
    unit: 'stuks',
    costPerUnit: 15.75,
    supplier: 'CND',
    lastUpdated: new Date('2024-01-12'),
    status: 'out-of-stock',
    sku: 'CND-TC-001',
    location: 'Rek A1'
  },
  {
    id: '4',
    name: 'Dermalogica Cleanser',
    category: 'Huidverzorging',
    currentStock: 12,
    minStock: 8,
    maxStock: 25,
    unit: 'stuks',
    costPerUnit: 28.50,
    supplier: 'Dermalogica',
    lastUpdated: new Date('2024-01-16'),
    status: 'in-stock',
    sku: 'DER-CL-250',
    location: 'Rek B1'
  },
  {
    id: '5',
    name: 'Wegwerp Handdoeken',
    category: 'Verbruiksartikelen',
    currentStock: 1,
    minStock: 10,
    maxStock: 50,
    unit: 'pakken',
    costPerUnit: 4.25,
    supplier: 'Hygiene Plus',
    lastUpdated: new Date('2024-01-13'),
    status: 'critical',
    sku: 'HYG-HD-100',
    location: 'Opslag C'
  },
  {
    id: '6',
    name: 'Massage Olie Lavendel',
    category: 'Massage',
    currentStock: 6,
    minStock: 4,
    maxStock: 15,
    unit: 'flessen',
    costPerUnit: 18.90,
    supplier: 'Aromatherapy Associates',
    lastUpdated: new Date('2024-01-15'),
    status: 'in-stock',
    sku: 'AA-MO-LAV',
    location: 'Rek D2'
  }
]

export function InventoryList({ onProductEdit, onStockAdjustment, onViewHistory }: InventoryListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800'
      case 'out-of-stock': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return 'Op voorraad'
      case 'low-stock': return 'Lage voorraad'
      case 'out-of-stock': return 'Uit voorraad'
      case 'critical': return 'Kritiek'
      default: return status
    }
  }

  const getStockLevel = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100
    return {
      percentage: Math.min(percentage, 100),
      color: current <= min ? 'bg-red-500' : current <= min * 1.5 ? 'bg-yellow-500' : 'bg-green-500'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Alle producten</h2>
        <div className="text-sm text-gray-600">
          {products.length} producten gevonden
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Categorie</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Huidige voorraad</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Min/Max</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Kostprijs</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Leverancier</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Locatie</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Laatste update</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Acties</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockLevel = getStockLevel(product.currentStock, product.minStock, product.maxStock)
              
              return (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.status === 'critical' && (
                          <div className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            Kritiek niveau
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {product.currentStock} {product.unit}
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
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      <div>Min: {product.minStock}</div>
                      <div>Max: {product.maxStock}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`status-chip ${getStatusColor(product.status)}`}>
                      {getStatusText(product.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-gray-900">
                      €{product.costPerUnit.toFixed(2)}
                    </span>
                    <div className="text-xs text-gray-600">per {product.unit.slice(0, -1)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-900">{product.supplier}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{product.location}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {format(product.lastUpdated, 'd MMM yyyy', { locale: nl })}
                    </span>
                  </td>
                  <td className="py-4 px-4">
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
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}