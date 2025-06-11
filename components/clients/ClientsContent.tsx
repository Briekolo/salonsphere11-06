'use client'

import { useState } from 'react'
import { ClientsOverview } from './ClientsOverview'
import { ClientsList } from './ClientsList'
import { ClientProfile } from './ClientProfile'
import { ClientsStats } from './ClientsStats'
import { ClientsFilters } from './ClientsFilters'

export function ClientsContent() {
  const [view, setView] = useState<'overview' | 'list' | 'profile'>('overview')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    setView('profile')
  }

  const handleBackToList = () => {
    setView('overview')
    setSelectedClientId(null)
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {view === 'profile' && selectedClientId ? (
        <ClientProfile clientId={selectedClientId} onBack={handleBackToList} />
      ) : (
        <>
          {/* Quick Stats */}
          <ClientsStats />
          
          {/* Filters and Actions */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="overflow-x-auto">
              <ClientsFilters />
            </div>
            
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-3">
              <button className="btn-outlined">
                Exporteren
              </button>
              <button className="btn-outlined">
                Importeren
              </button>
              <button className="btn-primary">
                Nieuwe klant
              </button>
            </div>
          </div>

          {/* Main Content */}
          {view === 'overview' ? (
            <ClientsOverview onClientSelect={handleClientSelect} onViewChange={setView} />
          ) : (
            <ClientsList onClientSelect={handleClientSelect} />
          )}
        </>
      )}
    </div>
  )
}