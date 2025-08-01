'use client'

import { Phone, Mail, MoreVertical, Search } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useClients, Client } from '@/lib/hooks/useClients'
import { ClientStatusBadge } from './ClientStatusBadge'
import { ClientStatusDropdown } from './ClientStatusDropdown'
import { ClientStatus } from '@/lib/services/clientStatusService'

// Utility functions for formatting
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || amount === 0) {
    return '€0,00'
  }
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatLastVisit = (date: string | null | undefined): string => {
  if (!date) {
    return 'Geen bezoeken'
  }
  try {
    return format(new Date(date), 'd MMM yyyy', { locale: nl })
  } catch {
    return 'Onbekend'
  }
}

interface ClientsListProps {
  clients: Client[]
  onClientSelect: (clientId: string) => void
  onViewChange: (view: 'overview' | 'list') => void
  searchTerm: string
  onDeleteClient?: (clientId: string) => void
  deletingClientId?: string | null
}

// Helper function for highlighting matches
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 rounded px-1">$1</mark>')
}

// Helper function to determine which field matched
const getMatchedField = (client: Client, query: string): string | null => {
  if (!query.trim()) return null
  const q = query.toLowerCase()
  if (client.first_name?.toLowerCase().includes(q)) return 'Voornaam'
  if (client.last_name?.toLowerCase().includes(q)) return 'Achternaam'
  if (client.email?.toLowerCase().includes(q)) return 'Email'
  if (client.phone?.toLowerCase().includes(q)) return 'Telefoon'
  if (client.notes?.toLowerCase().includes(q)) return 'Notities'
  return null
}

export function ClientsList({ clients, onClientSelect, onViewChange, searchTerm, onDeleteClient, deletingClientId }: ClientsListProps) {

  // Empty state for no results
  if (clients.length === 0 && searchTerm.trim()) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Search className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Geen klanten gevonden
        </h3>
        <p className="text-gray-600 mb-4">
          Geen resultaten voor "{searchTerm}". Probeer:
        </p>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• Controleer de spelling</li>
          <li>• Gebruik minder woorden</li>
          <li>• Probeer initialen (bijv. "JD" voor Jan de Vries)</li>
          <li>• Gebruik 'Slim zoeken' voor typfouten</li>
        </ul>
      </div>
    )
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
                  <div className="font-medium text-gray-900" 
                       dangerouslySetInnerHTML={{
                         __html: highlightMatch(`${client.first_name} ${client.last_name}`, searchTerm)
                       }} 
                  />
                  <div className="text-sm text-gray-600 truncate" 
                       dangerouslySetInnerHTML={{
                         __html: highlightMatch(client.email || '', searchTerm)
                       }} 
                  />
                  {client.phone && (
                    <div className="text-xs text-gray-500 truncate" 
                         dangerouslySetInnerHTML={{
                           __html: highlightMatch(client.phone, searchTerm)
                         }} 
                    />
                  )}
                  {client.notes && (
                    <div className="text-xs text-gray-500 truncate mt-1" 
                         dangerouslySetInnerHTML={{
                           __html: highlightMatch(client.notes, searchTerm)
                         }} 
                    />
                  )}
                  {searchTerm && getMatchedField(client, searchTerm) && (
                    <div className="text-xs text-primary-600 mt-1">
                      Gevonden in: {getMatchedField(client, searchTerm)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="mt-1">
                  <ClientStatusBadge 
                    status={(client.status as ClientStatus) || 'inactive'} 
                    showTooltip={false}
                  />
                </div>
              </div>
              <div>
                <span className="text-gray-600">Omzet:</span>
                <div className="font-medium text-gray-900">
                  {formatCurrency(client.total_spent)}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Laatste bezoek:</span>
                <div className="text-gray-900">
                  {formatLastVisit(client.last_visit_date)}
                </div>
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
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Omzet</th>
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
                      <div className="font-medium text-gray-900" 
                           dangerouslySetInnerHTML={{
                             __html: highlightMatch(`${client.first_name} ${client.last_name}`, searchTerm)
                           }} 
                      />
                      {client.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" 
                             dangerouslySetInnerHTML={{
                               __html: highlightMatch(client.notes, searchTerm)
                             }} 
                        />
                      )}
                      {searchTerm && getMatchedField(client, searchTerm) && (
                        <div className="text-xs text-primary-600 mt-1">
                          Gevonden in: {getMatchedField(client, searchTerm)}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <div className="text-gray-900" 
                         dangerouslySetInnerHTML={{
                           __html: highlightMatch(client.email || '', searchTerm)
                         }} 
                    />
                    {client.phone && (
                      <div className="text-gray-600" 
                           dangerouslySetInnerHTML={{
                             __html: highlightMatch(client.phone, searchTerm)
                           }} 
                      />
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <ClientStatusBadge 
                    status={(client.status as ClientStatus) || 'inactive'} 
                    showTooltip={false}
                  />
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(client.total_spent)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">
                    {formatLastVisit(client.last_visit_date)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button 
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (client.phone) {
                          window.open(`tel:${client.phone}`, '_self')
                        }
                      }}
                    >
                      <Phone className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (client.email) {
                          window.open(`mailto:${client.email}`, '_self')
                        }
                      }}
                    >
                      <Mail className="w-4 h-4 text-gray-500" />
                    </button>
                    <ClientStatusDropdown
                      clientId={client.id}
                      currentStatus={(client.status as ClientStatus) || 'inactive'}
                      onViewClient={onClientSelect}
                      onDeleteClient={onDeleteClient}
                      isDeleting={deletingClientId === client.id}
                      onStatusChange={(clientId, newStatus) => {
                        // TODO: Implement status change functionality
                        console.log('Status change:', clientId, newStatus)
                      }}
                    />
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