'use client'

import { useState } from 'react'
import { Phone, Mail, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useClients, Client } from '@/lib/hooks/useClients'

interface ClientsListProps {
  onClientSelect: (clientId: string) => void
  onViewChange: (view: 'overview' | 'list') => void
  searchTerm: string
}

export function ClientsList({ onClientSelect, onViewChange, searchTerm }: ClientsListProps) {
  const { data: clients = [], isLoading } = useClients(searchTerm)

  if (isLoading) {
    return <div className="card p-6 text-center">Klanten laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* View Toggle and Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button onClick={() => onViewChange('overview')} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900">
              Overzicht
            </button>
            <button onClick={() => onViewChange('list')} className="px-4 py-2 rounded-full text-sm font-medium bg-[#02011F] text-white">
              Lijst
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">{clients.length} klanten gevonden</div>
      </div>

      <div className="card">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
          <h2 className="text-heading">Alle klanten</h2>
        </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {clients.map((client: Client) => (
          <div key={client.id} className="p-4 border border-gray-200 rounded-lg cursor-pointer" onClick={() => onClientSelect(client.id)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center font-medium">
                  {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {client.first_name} {client.last_name}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{client.email}</div>
                  {client.notes && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {client.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-600">Laatste bezoek:</span>
                <span className="text-sm text-gray-600">
                  {client.last_visit_date ? format(new Date(client.last_visit_date), 'd MMM yyyy', { locale: nl }) : '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {/* Placeholder for extra info if needed */}
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-500" />
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
              <th className="text-left py-3 px-4 font-medium text-gray-600">Klant</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Uitgegeven</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Laatste bezoek</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Acties</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client: Client) => (
              <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onClientSelect(client.id)}>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center font-medium">
                      {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {client.first_name} {client.last_name}
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
                  <span className="text-sm font-medium text-gray-900">
                    €{client.total_spent}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">
                    {client.last_visit_date ? format(new Date(client.last_visit_date), 'd MMM yyyy', { locale: nl }) : '—'}
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
    </div>
  )
}