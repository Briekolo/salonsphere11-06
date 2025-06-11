'use client'

import { useState } from 'react'
import { TreatmentsOverview } from './TreatmentsOverview'
import { TreatmentsList } from './TreatmentsList'
import { TreatmentForm } from './TreatmentForm'
import { TreatmentsStats } from './TreatmentsStats'
import { TreatmentsFilters } from './TreatmentsFilters'
import { PricingCalculator } from './PricingCalculator'

export function TreatmentsContent() {
  const [view, setView] = useState<'overview' | 'list' | 'form' | 'calculator'>('overview')
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null)

  const handleTreatmentEdit = (treatmentId: string) => {
    setSelectedTreatment(treatmentId)
    setView('form')
  }

  const handleBackToOverview = () => {
    setView('overview')
    setSelectedTreatment(null)
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
              <TreatmentsFilters />
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => setView('calculator')}
                className="btn-outlined"
              >
                Prijscalculator
              </button>
              <button className="btn-outlined">
                Exporteren
              </button>
              <button 
                onClick={() => setView('form')}
                className="btn-primary"
              >
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
            <TreatmentsOverview onTreatmentEdit={handleTreatmentEdit} />
          ) : (
            <TreatmentsList onTreatmentEdit={handleTreatmentEdit} />
          )}
        </>
      )}
    </div>
  )
}