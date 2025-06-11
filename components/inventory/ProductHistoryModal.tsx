'use client'

import { useState } from 'react'
import { X, Plus, Minus, Package, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface ProductHistoryModalProps {
  productId: string
  onClose: () => void
}

interface HistoryEntry {
  id: string
  date: Date
  type: 'add' | 'remove' | 'set'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  notes?: string
  user: string
}

export function ProductHistoryModal({ productId, onClose }: ProductHistoryModalProps) {
  const [timeFilter, setTimeFilter] = useState('all')

  // Mock product data
  const product = {
    id: productId,
    name: 'OPI Base Coat',
    unit: 'stuks'
  }

  // Mock history data
  const history: HistoryEntry[] = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'add',
      quantity: 5,
      previousStock: 3,
      newStock: 8,
      reason: 'Levering ontvangen',
      notes: 'Bestelling #ORD-2024-001',
      user: 'Julia Smit'
    },
    {
      id: '2',
      date: new Date('2024-01-12'),
      type: 'remove',
      quantity: 2,
      previousStock: 5,
      newStock: 3,
      reason: 'Verbruik behandeling',
      user: 'Emma de Vries'
    },
    {
      id: '3',
      date: new Date('2024-01-08'),
      type: 'add',
      quantity: 10,
      previousStock: 0,
      newStock: 10,
      reason: 'Levering ontvangen',
      notes: 'Nieuwe voorraad van leverancier',
      user: 'Julia Smit'
    },
    {
      id: '4',
      date: new Date('2024-01-05'),
      type: 'remove',
      quantity: 5,
      previousStock: 5,
      newStock: 0,
      reason: 'Verbruik behandeling',
      user: 'Sophie Janssen'
    },
    {
      id: '5',
      date: new Date('2024-01-03'),
      type: 'set',
      quantity: 5,
      previousStock: 3,
      newStock: 5,
      reason: 'Correctie telling',
      notes: 'Voorraadtelling uitgevoerd',
      user: 'Julia Smit'
    }
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <Plus className="w-4 h-4 text-green-600" />
      case 'remove': return <Minus className="w-4 h-4 text-red-600" />
      case 'set': return <Package className="w-4 h-4 text-blue-600" />
      default: return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'add': return 'bg-green-50 border-green-200'
      case 'remove': return 'bg-red-50 border-red-200'
      case 'set': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'add': return 'Toegevoegd'
      case 'remove': return 'Verwijderd'
      case 'set': return 'Ingesteld'
      default: return type
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Voorraadhistorie</h2>
            <p className="text-sm text-gray-600">{product.name}</p>
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
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className={`p-4 rounded-lg border ${getTypeColor(entry.type)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(entry.type)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {getTypeText(entry.type)} - {entry.reason}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(entry.date, 'd MMM yyyy HH:mm', { locale: nl })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {entry.type === 'add' ? '+' : entry.type === 'remove' ? '-' : '='}{entry.quantity} {product.unit}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.previousStock} → {entry.newStock}
                    </div>
                  </div>
                </div>
                
                {entry.notes && (
                  <div className="text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                    <strong>Notitie:</strong> {entry.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
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