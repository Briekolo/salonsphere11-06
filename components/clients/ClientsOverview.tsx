'use client'

import { useState } from 'react'
import { Phone, Mail, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useClients, Client } from '@/lib/hooks/useClients'
import { useToast } from '@/components/providers/ToastProvider'
import { handleEmailClick, handlePhoneClick } from '@/lib/utils/emailUtils'

interface ClientsOverviewProps {
  onClientSelect: (clientId: string) => void
  onViewChange: (view: 'overview' | 'list') => void
  searchTerm: string
}

export function ClientsOverview({ onClientSelect, onViewChange, searchTerm }: ClientsOverviewProps) {
  const { data: clients = [], isLoading } = useClients(searchTerm)
  const { showToast } = useToast()

  if (isLoading) {
    return <div className="card p-6 text-center">Klanten laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* View Toggle and Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button onClick={() => onViewChange('overview')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#02011F] text-white min-h-[32px] sm:min-h-[36px]">
              Overzicht
            </button>
            <button onClick={() => onViewChange('list')} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 min-h-[32px] sm:min-h-[36px]">
              Lijst
            </button>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-600">{clients.length} klanten gevonden</div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {clients.map((client: Client) => (
          <div key={client.id} className="card p-4 sm:p-6 group cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClientSelect(client.id)}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center font-medium">
                  {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{client.first_name} {client.last_name}</h3>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600">Uitgegeven:</span>
                <span className="ml-2 font-medium">€{client.total_spent}</span>
              </div>
              <div>
                <span className="text-gray-600">Laatste bezoek:</span>
                <span className="ml-2">{client.last_visit_date ? format(new Date(client.last_visit_date), 'd MMM yyyy', { locale: nl }) : '—'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                className="btn-outlined flex-1 flex items-center justify-center gap-1 text-xs py-2 min-h-[36px]"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePhoneClick(client.phone || '', {
                    showToast,
                    debugMode: true
                  })
                }}
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">Bellen</span>
              </button>
              <button 
                className="btn-outlined flex-1 flex items-center justify-center gap-1 text-xs py-2 min-h-[36px]"
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleEmailClick(client.email || '', {
                    showToast,
                    debugMode: true
                  })
                }}
              >
                <Mail className="w-3 h-3" />
                <span className="hidden sm:inline">Mailen</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}