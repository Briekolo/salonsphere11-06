'use client'

import { useState } from 'react'
import { Eye, Phone, Mail, MoreVertical, Star, Calendar, Euro } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar: string
  status: 'active' | 'inactive' | 'vip' | 'new'
  segment: 'regular' | 'premium' | 'occasional'
  lastVisit: Date
  totalSpent: number
  appointmentsCount: number
  notes?: string
  tags: string[]
}

interface ClientsOverviewProps {
  onClientSelect: (clientId: string) => void
  onViewChange: (view: 'overview' | 'list') => void
}

const clients: Client[] = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'de Vries',
    email: 'emma@example.com',
    phone: '+31 6 12345678',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    status: 'vip',
    segment: 'premium',
    lastVisit: new Date('2024-01-15'),
    totalSpent: 1250,
    appointmentsCount: 12,
    tags: ['VIP', 'Regulier']
  },
  {
    id: '2',
    firstName: 'Sophie',
    lastName: 'Janssen',
    email: 'sophie@example.com',
    phone: '+31 6 87654321',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    status: 'active',
    segment: 'regular',
    lastVisit: new Date('2024-01-12'),
    totalSpent: 680,
    appointmentsCount: 8,
    tags: ['Regulier']
  },
  {
    id: '3',
    firstName: 'Thomas',
    lastName: 'Bakker',
    email: 'thomas@example.com',
    phone: '+31 6 11223344',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    status: 'new',
    segment: 'occasional',
    lastVisit: new Date('2024-01-10'),
    totalSpent: 85,
    appointmentsCount: 1,
    tags: ['Nieuw'],
    notes: 'Eerste bezoek, allergisch voor lavendel'
  },
  {
    id: '4',
    firstName: 'Lisa',
    lastName: 'Visser',
    email: 'lisa@example.com',
    phone: '+31 6 99887766',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    status: 'active',
    segment: 'premium',
    lastVisit: new Date('2024-01-08'),
    totalSpent: 920,
    appointmentsCount: 15,
    tags: ['Premium', 'Trouw']
  }
]

export function ClientsOverview({ onClientSelect, onViewChange }: ClientsOverviewProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vip': return 'VIP'
      case 'active': return 'Actief'
      case 'new': return 'Nieuw'
      case 'inactive': return 'Inactief'
      default: return status
    }
  }

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => onViewChange('overview')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#02011F] text-white"
            >
              Overzicht
            </button>
            <button
              onClick={() => onViewChange('list')}
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Lijst
            </button>
          </div>

          {selectedClients.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedClients.length} geselecteerd
              </span>
              <button className="btn-outlined text-xs px-3 py-1">
                Bulk acties
              </button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {clients.length} klanten gevonden
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="card group cursor-pointer" onClick={() => onClientSelect(client.id)}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={client.avatar} 
                    alt={`${client.firstName} ${client.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {client.status === 'vip' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {client.firstName} {client.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleClientSelection(client.id)
                  }}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <button 
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Status and Tags */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`status-chip ${getStatusColor(client.status)}`}>
                {getStatusText(client.status)}
              </span>
              {client.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {client.appointmentsCount}
                </div>
                <div className="text-xs text-gray-600">Afspraken</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  €{client.totalSpent}
                </div>
                <div className="text-xs text-gray-600">Uitgegeven</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {format(client.lastVisit, 'd MMM', { locale: nl })}
                </div>
                <div className="text-xs text-gray-600">Laatste bezoek</div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="mb-4 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                <strong>Notitie:</strong> {client.notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <button className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-700">
                <Eye className="w-4 h-4" />
                Bekijk profiel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}