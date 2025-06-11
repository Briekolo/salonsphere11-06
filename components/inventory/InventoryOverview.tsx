'use client'

import { useState } from 'react'
import { Package, AlertTriangle, Edit, Plus, Minus, History, ShoppingCart } from 'lucide-react'
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
  image?: string
  sku: string
  location: string
}

interface InventoryOverviewProps {
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

const categories = [
  { name: 'Alle', count: products.length },
  { name: 'Nagelverzorging', count: products.filter(p => p.category === 'Nagelverzorging').length },
  { name: 'Huidverzorging', count: products.filter(p => p.category === 'Huidverzorging').length },
  { name: 'Verbruiksartikelen', count: products.filter(p => p.category === 'Verbruiksartikelen').length },
  { name: 'Massage', count: products.filter(p => p.category === 'Massage').length }
]

export function InventoryOverview({ onProductEdit, onStockAdjustment, onViewHistory }: InventoryOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const filteredProducts = selectedCategory === 'Alle' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800'
      case 'out-of-stock': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-100 text-red-800 animate-pulse'
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

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100)
  }

  const getStockBarColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-500'
      case 'low-stock': return 'bg-yellow-500'
      case 'out-of-stock': return 'bg-red-500'
      case 'critical': return 'bg-red-600'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">Voorraad waarschuwingen</h3>
            <p className="text-red-800 mb-3">
              Er zijn {products.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock' || p.status === 'critical').length} producten die aandacht nodig hebben.
            </p>
            <div className="flex flex-wrap gap-2">
              {products.filter(p => p.status !== 'in-stock').map((product) => (
                <span key={product.id} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {product.name} ({product.currentStock} {product.unit})
                </span>
              ))}
            </div>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Bestelling plaatsen
          </button>
        </div>
      </div>

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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card group">
            {/* Product Header */}
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
                <span className={`status-chip ${getStatusColor(product.status)}`}>
                  {getStatusText(product.status)}
                </span>
                <button 
                  onClick={() => onProductEdit(product.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Stock Information */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Huidige voorraad</span>
                <span className="font-medium">{product.currentStock} {product.unit}</span>
              </div>
              
              {/* Stock Bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStockBarColor(product.status)}`}
                    style={{ width: `${getStockPercentage(product.currentStock, product.maxStock)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Min: {product.minStock}</span>
                  <span>Max: {product.maxStock}</span>
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
                <span className="font-medium">€{product.costPerUnit.toFixed(2)} per {product.unit.slice(0, -1)}</span>
              </div>

              <div className="text-xs text-gray-600">
                Laatst bijgewerkt: {format(product.lastUpdated, 'd MMM yyyy', { locale: nl })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button 
                onClick={() => onStockAdjustment(product.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Aanpassen
              </button>
              <button 
                onClick={() => onViewHistory(product.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <History className="w-4 h-4" />
              </button>
            </div>

            {/* Critical Stock Warning */}
            {product.status === 'critical' && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Kritieke voorraad!</span>
                </div>
                <p className="text-red-700 text-xs mt-1">
                  Direct bijbestellen aanbevolen
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Voorraad beheren
          </h2>
          <p className="text-gray-600 mb-6">
            Houd uw voorraad up-to-date en voorkom tekorten
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nieuw product
            </button>
            <button className="btn-outlined flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Bestelling plaatsen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}