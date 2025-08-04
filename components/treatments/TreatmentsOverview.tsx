'use client'

import { useState } from 'react'
import { Clock, Euro, Edit, Star, Calendar, Users, Package } from 'lucide-react'
import { useServices, Service } from '@/lib/hooks/useServices'
import { ServiceService } from '@/lib/services/serviceService'
import { getCategoryBadgeClasses } from '@/lib/utils/categoryColors'
import { useOverheadMetrics } from '@/lib/hooks/useOverheadCalculations'
import Image from 'next/image'

interface TreatmentsOverviewProps {
  onTreatmentEdit: (treatmentId: string) => void
  searchTerm: string
}

export function TreatmentsOverview({ onTreatmentEdit, searchTerm }: TreatmentsOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const { data: treatments = [], isLoading } = useServices()
  const { data: overheadMetrics } = useOverheadMetrics()

  const searchedTreatments = treatments.filter(treatment =>
    (treatment.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <div className="card p-6 text-center">Behandelingen laden...</div>
  }

  const categories = [
    { name: 'Alle', count: treatments.length },
    ...Object.entries(
      treatments.reduce((acc, t) => {
        const categoryName = t.treatment_categories?.name || t.category
        acc[categoryName] = (acc[categoryName] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([name, count]) => ({ name, count })),
  ]

  const filteredTreatments =
    selectedCategory === 'Alle'
      ? searchedTreatments
      : searchedTreatments.filter(t => (t.treatment_categories?.name || t.category) === selectedCategory)

  if (filteredTreatments.length === 0 && !isLoading) {
    if (searchTerm) {
      return (
        <div className="card p-6 text-center">
          <p className="text-gray-600">
            Geen behandelingen gevonden voor zoekterm &apos;{searchTerm}&apos;.
          </p>
        </div>
      )
    }
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-600">
          Geen behandelingen gevonden in de categorie &apos;{selectedCategory}&apos;.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section (kan eventueel weg of aangepast) */}
      <div className="card p-4 sm:p-6">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Onze Behandelingen</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
            Bekijk, beheer en organiseer hier alle behandelingen die uw salon aanbiedt.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors min-h-[32px] sm:min-h-[36px] ${
              selectedCategory === category.name
                ? 'bg-[#02011F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                selectedCategory === category.name
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Treatments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {filteredTreatments.map(treatment => (
          <div
            key={treatment.id}
            className="card group cursor-pointer p-3 sm:p-4 lg:p-6"
            onClick={() => onTreatmentEdit(treatment.id)}
          >
            {/* Treatment Image */}
            <div className="relative mb-3 sm:mb-4 overflow-hidden rounded-lg">
              <Image
                src={treatment.image_url || '/placeholder-image.jpg'}
                alt={treatment.name}
                width={400}
                height={300}
                className="w-full h-32 sm:h-40 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Treatment Info */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{treatment.name}</h3>
                    {(treatment.treatments_needed || 1) > 1 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        <Package className="w-3 h-3" />
                        <span>{treatment.treatments_needed}x</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${getCategoryBadgeClasses(treatment.treatment_categories?.color)}`}>
                    {treatment.treatment_categories?.name || treatment.category}
                  </span>
                </div>
                <button
                  className="p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                  onClick={e => {
                    e.stopPropagation()
                    onTreatmentEdit(treatment.id)
                  }}
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{treatment.description}</p>

              {/* Stats */}
              <div className="flex items-center justify-between py-2 sm:py-3 border-t border-gray-100">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{treatment.duration_minutes}min</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">€{treatment.price}</span>
                </div>
              </div>
              
              {/* Overhead */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 pb-2">
                <span>Overhead per behandeling:</span>
                <span className="font-medium">
                  {overheadMetrics ? `€${(overheadMetrics.overhead_per_treatment).toFixed(2)}` : '--'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 gap-2">
                <div className="flex items-center gap-1">
                   {/* Placeholder voor rating */}
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300 fill-current" />
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Geen rating</span>
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="text-gray-600">Marge: </span>
                  <span className="font-medium text-green-600">
                    {overheadMetrics 
                      ? ServiceService.calculateMarginWithOverhead(
                          treatment.price, 
                          treatment.material_cost ?? 0, 
                          overheadMetrics.overhead_per_treatment
                        ).toFixed(1)
                      : ServiceService.calculateMargin(treatment.price, treatment.material_cost ?? 0).toFixed(1)
                    }%
                  </span>
                  {overheadMetrics && (
                    <span className="text-xs text-gray-500 ml-1 hidden sm:inline">(incl. overhead)</span>
                  )}
                </div>
              </div>

              {/* Details (preparation/aftercare) */}
              <div className="space-y-1 sm:space-y-2 pt-2">
                 <div className="text-xs font-medium text-gray-700">Voorbereiding:</div>
                 <p className="text-xs text-gray-600 line-clamp-2">{treatment.preparation_info || 'Geen specifieke voorbereiding nodig.'}</p>
                 <div className="text-xs font-medium text-gray-700 pt-1">Nazorg:</div>
                 <p className="text-xs text-gray-600 line-clamp-2">{treatment.aftercare_info || 'Geen specifieke nazorg nodig.'}</p>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-3 sm:mt-4 btn-outlined text-xs sm:text-sm py-2 sm:py-2.5">Inplannen</button>
          </div>
        ))}
      </div>
    </div>
  )
}