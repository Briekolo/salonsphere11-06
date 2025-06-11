'use client'

import { useState } from 'react'
import { Phone, Mail, MoreVertical, Star, Calendar, Eye } from 'lucide-react'
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

interface ClientsListProps {
  onClientSelect: (clientId: string) => void
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

export function ClientsList({ onClientSelect }: ClientsListProps) {
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

  const toggleAllSelection = () => {
    setSelectedClients(prev => 
      prev.length === clients.length ? [] : clients.map(c => c.id)
    )
  }

  return (
    <div className="card">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <h2 className="text-heading">Alle klanten</h2>
        
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

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {clients.map((client) => (
          <div key={client.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={client.avatar} 
                    alt={`${client.firstName} ${client.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {client.status === 'vip' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="w-2 h-2 text-white fill-current" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{client.email}</div>
                  {client.notes && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {client.notes}
                    </div>
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedClients.includes(client.id)}
                onChange={() => toggleClientSelection(client.id)}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`status-chip ml-2 ${getStatusColor(client.status)}`}>
                  {getStatusText(client.status)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Segment:</span>
                <span className="ml-2 capitalize">{client.segment}</span>
              </div>
              <div>
                <span className="text-gray-600">Afspraken:</span>
                <span className="ml-2 font-medium">{client.appointmentsCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Uitgegeven:</span>
                <span className="ml-2 font-medium">€{client.totalSpent}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Laatste bezoek: {format(client.lastVisit, 'd MMM yyyy', { locale: nl })}
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  onClick={() => onClientSelect(client.id)}
                  className="p-2 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedClients.length === clients.length}
                  onChange={toggleAllSelection}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Klant</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Segment</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Afspraken</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Uitgegeven</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Laatste bezoek</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Acties</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => toggleClientSelection(client.id)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={client.avatar} 
                        alt={`${client.firstName} ${client.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {client.status === 'vip' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {client.firstName} {client.lastName}
                      </div>
                      {client.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {client.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <div className="text-gray-900">{client.email}</div>
                    <div className="text-gray-600">{client.phone}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`status-chip ${getStatusColor(client.status)}`}>
                    {getStatusText(client.status)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600 capitalize">
                    {client.segment}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">
                    {client.appointmentsCount}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">
                    €{client.totalSpent}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">
                    {format(client.lastVisit, 'd MMM yyyy', { locale: nl })}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Mail className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Calendar className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => onClientSelect(client.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}