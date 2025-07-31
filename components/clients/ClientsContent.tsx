'use client'

import { useState, useRef } from 'react'
import { ClientsOverview } from './ClientsOverview'
import { ClientsList } from './ClientsList'
import { ClientProfile } from './ClientProfile'
import { ClientsStats } from './ClientsStats'
import { ClientsFilters } from './ClientsFilters'
import { FileText, Upload, PlusCircle } from 'lucide-react'
import { useClients as useClientsHook } from '@/lib/hooks/useClients'
import { useCreateClient } from '@/lib/hooks/useClients'
import { ClientForm } from './ClientForm'

export function ClientsContent() {
  const [view, setView] = useState<'overview' | 'list' | 'profile' | 'form'>('overview')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: allClients = [], isLoading: clientsLoading } = useClientsHook(searchTerm)
  const createMutation = useCreateClient()

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    setView('profile')
  }

  const handleBackToList = () => {
    setView('overview')
    setSelectedClientId(null)
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

  const handleImportButton = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file) return
    const text = await file.text()
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const headers = headerLine.split(',')
    lines.forEach(line => {
      const values = line.split(',')
      if(values.length !== headers.length) return
      const item:any = {}
      headers.forEach((h,idx)=> item[h] = values[idx])
      createMutation.mutate(item)
    })
    e.target.value=''
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
                isLoading={clientsLoading}
              />
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 lg:space-x-3">
              {/* Export */}
              <button onClick={handleExport} className="btn-outlined flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px]">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Exporteren</span>
              </button>

              {/* Import */}
              <button onClick={handleImportButton} className="btn-outlined flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px]">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importeren</span>
              </button>
              <input type="file" accept=".csv,text/csv" ref={fileInputRef} onChange={handleImportFile} className="hidden" />

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
              onClientSelect={handleClientSelect}
              onViewChange={setView}
              searchTerm={searchTerm}
            />
          ) : (
            <ClientsList
              onClientSelect={handleClientSelect}
              onViewChange={setView}
              searchTerm={searchTerm}
            />
          )}
        </>
      )}
    </div>
  )
}