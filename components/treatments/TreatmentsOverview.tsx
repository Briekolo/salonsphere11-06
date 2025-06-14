'use client'

import { useState } from 'react'
import { Clock, Euro, Edit, Star, Calendar, Users } from 'lucide-react'
import { useServices, Service } from '@/lib/hooks/useServices'
import { ServiceService } from '@/lib/services/serviceService'
import Image from 'next/image'

interface TreatmentsOverviewProps {
  onTreatmentEdit: (treatmentId: string) => void
  searchTerm: string
}

export function TreatmentsOverview({ onTreatmentEdit, searchTerm }: TreatmentsOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const { data: treatments = [], isLoading } = useServices()

  const searchedTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <div className="card p-6 text-center">Behandelingen laden...</div>
  }

  const categories = [
    { name: 'Alle', count: treatments.length },
    ...Object.entries(
      treatments.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([name, count]) => ({ name, count })),
  ]

  const filteredTreatments =
    selectedCategory === 'Alle'
      ? searchedTreatments
      : searchedTreatments.filter(t => t.category === selectedCategory)

  if (filteredTreatments.length === 0 && !isLoading) {
    if (searchTerm) {
      return (
        <div className="card p-6 text-center">
          <p className="text-gray-600">
            Geen behandelingen gevonden voor zoekterm '{searchTerm}'.
          </p>
        </div>
      )
    }
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-600">
          Geen behandelingen gevonden in de categorie '{selectedCategory}'.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section (kan eventueel weg of aangepast) */}
      <div className="card">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Onze Behandelingen</h1>
          <p className="text-lg text-gray-600 mb-6">
            Bekijk, beheer en organiseer hier alle behandelingen die uw salon aanbiedt.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.name
                ? 'bg-[#02011F] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTreatments.map(treatment => (
          <div
            key={treatment.id}
            className="card group cursor-pointer"
            onClick={() => onTreatmentEdit(treatment.id)}
          >
            {/* Treatment Image */}
            <div className="relative mb-4 overflow-hidden rounded-lg">
              <Image
                src={treatment.image_url || '/placeholder-image.jpg'}
                alt={treatment.name}
                width={400}
                height={300}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Treatment Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{treatment.name}</h3>
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {treatment.category}
                  </span>
                </div>
                <button
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                  onClick={e => {
                    e.stopPropagation()
                    onTreatmentEdit(treatment.id)
                  }}
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{treatment.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 py-3 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Clock className="w-3 h-3" />
                    {treatment.duration_minutes}min
                  </div>
                  <div className="text-xs text-gray-600">Duur</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Euro className="w-3 h-3" />
                    {treatment.price}
                  </div>
                  <div className="text-xs text-gray-600">Prijs</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Users className="w-3 h-3" />
                    {treatment.aantal_sessies ?? 1}
                  </div>
                  <div className="text-xs text-gray-600">Sessies</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-gray-900">
                    <Calendar className="w-3 h-3" />
                    --
                  </div>
                  <div className="text-xs text-gray-600">Deze maand</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                   {/* Placeholder voor rating */}
                  <Star className="w-4 h-4 text-gray-300 fill-current" />
                  <span className="text-sm font-medium text-gray-400">Geen rating</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Marge: </span>
                  <span className="font-medium text-green-600">
                    {ServiceService.calculateMargin(treatment.price, treatment.material_cost ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Details (preparation/aftercare) */}
              <div className="space-y-2 pt-2">
                 <div className="text-xs font-medium text-gray-700">Voorbereiding:</div>
                 <p className="text-xs text-gray-600">{treatment.preparation_info || 'Geen specifieke voorbereiding nodig.'}</p>
                 <div className="text-xs font-medium text-gray-700 pt-1">Nazorg:</div>
                 <p className="text-xs text-gray-600">{treatment.aftercare_info || 'Geen specifieke nazorg nodig.'}</p>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-4 btn-outlined">Inplannen</button>
          </div>
        ))}
      </div>
    </div>
  )
}