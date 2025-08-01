'use client'

import { useState, useMemo } from 'react'
import { ClientsOverview } from './ClientsOverview'
import { ClientsList } from './ClientsList'
import { ClientProfile } from './ClientProfile'
import { ClientsStats } from './ClientsStats'
import { ClientsFilters } from './ClientsFilters'
import { FileText, PlusCircle } from 'lucide-react'
import { useClients as useClientsHook } from '@/lib/hooks/useClients'
import { useCreateClient, useDeleteClient } from '@/lib/hooks/useClients'
import { ClientForm } from './ClientForm'
import { ClientStatus } from '@/lib/services/clientStatusService'

export function ClientsContent() {
  const [view, setView] = useState<'overview' | 'list' | 'profile' | 'form'>('overview')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)


  const { data: allClients = [], isLoading: clientsLoading } = useClientsHook(searchTerm)
  const createMutation = useCreateClient()
  const deleteMutation = useDeleteClient()

  // Filter clients by status
  const filteredClients = useMemo(() => {
    if (statusFilter === 'all') {
      return allClients
    }
    return allClients.filter(client => client.status === statusFilter)
  }, [allClients, statusFilter])

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    setView('profile')
  }

  const handleBackToList = () => {
    setView('overview')
    setSelectedClientId(null)
  }

  const handleDeleteClient = async (clientId: string) => {
    const client = allClients.find(c => c.id === clientId)
    if (!client) return

    const confirmMessage = `Weet je zeker dat je klant "${client.first_name} ${client.last_name}" wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt. Alle gekoppelde boekingen, betalingen en marketing gegevens worden ook verwijderd.`
    
    if (window.confirm(confirmMessage)) {
      setDeletingClientId(clientId)
      
      try {
        await deleteMutation.mutateAsync(clientId)
        
        // Show success message
        alert(`Klant "${client.first_name} ${client.last_name}" is succesvol verwijderd.`)
        
        // If we were viewing this client's profile, go back to the list
        if (selectedClientId === clientId) {
          setView('overview')
          setSelectedClientId(null)
        }
        
      } catch (error) {
        console.error('Error deleting client:', error)
        
        // Show specific error message
        const errorMessage = error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden bij het verwijderen van de klant.'
        alert(errorMessage)
        
      } finally {
        setDeletingClientId(null)
      }
    }
  }

  const handleExport = () => {
    const clientsToExport = allClients
    if (!clientsToExport || clientsToExport.length === 0) return
    const header = ['first_name','last_name','email','phone']
    const rows = clientsToExport.map(c=>[
      c.first_name,
      c.last_name,
      c.email,
      c.phone ?? ''
    ])
    const csv = [header.join(','), ...rows.map(r => r.map(v =>
  `"${String(v).replace(/"/g,'""')}"`).join(',')
)].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download','klanten_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
              <ClientsFilters 
                searchTerm={searchTerm} 
                onSearch={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilter={setStatusFilter}
                isLoading={clientsLoading}
              />
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 lg:space-x-3">
              {/* Export */}
              <button onClick={handleExport} className="btn-outlined flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px]">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Exporteren</span>
              </button>


              {/* Nieuw */}
              <button onClick={()=>setView('form')} className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px]">
                <PlusCircle className="w-4 h-4" />
                <span>Nieuwe klant</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          {view === 'form' ? (
            <ClientForm clientId={null} onBack={() => setView('overview')} />
          ) : view === 'overview' ? (
            <ClientsOverview
              clients={filteredClients}
              onClientSelect={handleClientSelect}
              onViewChange={setView}
              searchTerm={searchTerm}
              onDeleteClient={handleDeleteClient}
            />
          ) : (
            <ClientsList
              clients={filteredClients}
              onClientSelect={handleClientSelect}
              onViewChange={setView}
              searchTerm={searchTerm}
              onDeleteClient={handleDeleteClient}
              deletingClientId={deletingClientId}
            />
          )}
        </>
      )}
    </div>
  )
}