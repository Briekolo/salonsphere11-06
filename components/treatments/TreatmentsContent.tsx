'use client'

import { useState } from 'react'
import { TreatmentsOverview } from './TreatmentsOverview'
import { TreatmentsList } from './TreatmentsList'
import { TreatmentForm } from './TreatmentForm'
import { TreatmentsStats } from './TreatmentsStats'
import { TreatmentsFilters } from './TreatmentsFilters'
import { PricingCalculator } from './PricingCalculator'
import { CategoryManagement } from './CategoryManagement'
import { StaffAssignments } from './StaffAssignments'
import { Calculator, Upload, Plus, Settings, Users, Package, Tag } from 'lucide-react'
import { useServices } from '@/lib/hooks/useServices'

export function TreatmentsContent() {
  const [activeTab, setActiveTab] = useState<'treatments' | 'categories' | 'staff' | 'packages' | 'pricing'>('treatments')
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
        t.name,
        t.treatment_categories?.name || t.category,
        t.duration_minutes,
        t.price,
        t.material_cost,
        t.active
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
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
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('treatments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'treatments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Behandelingen
            </div>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categorieën
            </div>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'staff'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Medewerker toewijzingen
            </div>
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'packages'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Pakketten
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Binnenkort</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Prijsniveaus
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Binnenkort</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'treatments' && (
        view === 'form' ? (
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
                  className="btn-primary"
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
        )
      )}

      {activeTab === 'categories' && <CategoryManagement />}
      
      {activeTab === 'staff' && <StaffAssignments />}
      
      {activeTab === 'packages' && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pakketten komen binnenkort</h3>
          <p className="text-gray-600">
            Stel behandelingspakketten samen met kortingen en bundels.
          </p>
        </div>
      )}
      
      {activeTab === 'pricing' && (
        <div className="text-center py-12">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prijsniveaus komen binnenkort</h3>
          <p className="text-gray-600">
            Stel verschillende prijzen in voor studenten, senioren en VIP klanten.
          </p>
        </div>
      )}
    </div>
  )
}