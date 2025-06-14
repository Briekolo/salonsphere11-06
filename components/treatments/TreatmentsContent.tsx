'use client'

import { useState } from 'react'
import { TreatmentsOverview } from './TreatmentsOverview'
import { TreatmentsList } from './TreatmentsList'
import { TreatmentForm } from './TreatmentForm'
import { TreatmentsStats } from './TreatmentsStats'
import { TreatmentsFilters } from './TreatmentsFilters'
import { PricingCalculator } from './PricingCalculator'
import { Calculator, Upload, Plus } from 'lucide-react'
import { useServices } from '@/lib/hooks/useServices'

export function TreatmentsContent() {
  const [view, setView] = useState<'overview' | 'list' | 'form' | 'calculator'>('overview')
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { data: treatments = [] } = useServices()

  const handleTreatmentEdit = (treatmentId: string) => {
    setSelectedTreatment(treatmentId)
    setView('form')
  }

  const handleBackToOverview = () => {
    setView('overview')
    setSelectedTreatment(null)
  }

  const handleExport = () => {
    const filteredTreatments = treatments.filter(treatment =>
      treatment.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const headers = ['ID', 'Name', 'Category', 'Duration (min)', 'Price', 'Material Cost', 'Active']
    const csvContent = [
      headers.join(','),
      ...filteredTreatments.map(t => [
        t.id,
        `"${t.name.replace(/"/g, '""')}"`,
        t.category,
        t.duration_minutes,
        t.price,
        t.material_cost,
        t.active
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `salonsphere_behandelingen_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      {view === 'form' ? (
        <TreatmentForm treatmentId={selectedTreatment} onBack={handleBackToOverview} />
      ) : view === 'calculator' ? (
        <PricingCalculator onBack={handleBackToOverview} />
      ) : (
        <>
          {/* Quick Stats */}
          <TreatmentsStats />
          
          {/* Filters and Actions */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="overflow-x-auto">
              <TreatmentsFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => setView('calculator')}
                className="btn-outlined flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Prijscalculator
              </button>
              <button 
                onClick={handleExport}
                className="btn-outlined flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Exporteren
              </button>
              <button 
                onClick={() => setView('form')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nieuwe behandeling
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setView('overview')}
                className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                  view === 'overview'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overzicht
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                  view === 'list'
                    ? 'bg-[#02011F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lijst
              </button>
            </div>
          </div>

          {/* Main Content */}
          {view === 'overview' ? (
            <TreatmentsOverview searchTerm={searchTerm} onTreatmentEdit={handleTreatmentEdit} />
          ) : (
            <TreatmentsList searchTerm={searchTerm} onTreatmentEdit={handleTreatmentEdit} />
          )}
        </>
      )}
    </div>
  )
}