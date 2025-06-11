'use client'

import { Clock, Euro, Edit, Star, MoreVertical, Eye, Calendar } from 'lucide-react'

interface Treatment {
  id: string
  name: string
  category: string
  description: string
  duration: number
  price: number
  materialCost: number
  margin: number
  popularity: number
  bookingsThisMonth: number
  rating: number
  active: boolean
}

interface TreatmentsListProps {
  onTreatmentEdit: (treatmentId: string) => void
}

const treatments: Treatment[] = [
  {
    id: '1',
    name: 'Klassieke Pedicure',
    category: 'Nagelverzorging',
    description: 'Complete voetbehandeling inclusief nagelverzorging en eeltverwijdering',
    duration: 45,
    price: 65,
    materialCost: 12,
    margin: 81.5,
    popularity: 92,
    bookingsThisMonth: 28,
    rating: 4.8,
    active: true
  },
  {
    id: '2',
    name: 'Luxe Manicure',
    category: 'Nagelverzorging',
    description: 'Professionele handverzorging met nagelbehandeling en handmassage',
    duration: 60,
    price: 55,
    materialCost: 8,
    margin: 85.5,
    popularity: 88,
    bookingsThisMonth: 24,
    rating: 4.9,
    active: true
  },
  {
    id: '3',
    name: 'Anti-Aging Gezichtsbehandeling',
    category: 'Gezichtsbehandelingen',
    description: 'Intensieve behandeling tegen veroudering met peptiden en hyaluronzuur',
    duration: 90,
    price: 125,
    materialCost: 25,
    margin: 80,
    popularity: 76,
    bookingsThisMonth: 18,
    rating: 4.7,
    active: true
  },
  {
    id: '4',
    name: 'Ontspanningsmassage',
    category: 'Massage',
    description: 'Volledige lichaamsmassage voor diepe ontspanning met aromatherapie',
    duration: 75,
    price: 95,
    materialCost: 15,
    margin: 84.2,
    popularity: 84,
    bookingsThisMonth: 22,
    rating: 4.8,
    active: true
  },
  {
    id: '5',
    name: 'Brazilian Wax',
    category: 'Ontharing',
    description: 'Professionele ontharing van het intieme gebied met hoogwaardige wax',
    duration: 30,
    price: 45,
    materialCost: 6,
    margin: 86.7,
    popularity: 71,
    bookingsThisMonth: 16,
    rating: 4.6,
    active: true
  },
  {
    id: '6',
    name: 'Hydraterende Gezichtsbehandeling',
    category: 'Gezichtsbehandelingen',
    description: 'Intensieve hydratatie voor droge huid met hyaluronzuur masker',
    duration: 60,
    price: 75,
    materialCost: 18,
    margin: 76,
    popularity: 79,
    bookingsThisMonth: 20,
    rating: 4.7,
    active: false
  }
]

export function TreatmentsList({ onTreatmentEdit }: TreatmentsListProps) {
  const getMarginColor = (margin: number) => {
    if (margin >= 80) return 'text-green-600'
    if (margin >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 85) return 'bg-green-100 text-green-800'
    if (popularity >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Alle behandelingen</h2>
        <div className="text-sm text-gray-600">
          {treatments.length} behandelingen gevonden
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Behandeling</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Categorie</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Duur</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Prijs</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Materiaalkosten</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Marge</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Populariteit</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Deze maand</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Rating</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Acties</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map((treatment) => (
              <tr key={treatment.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{treatment.name}</div>
                    <div className="text-sm text-gray-600 truncate max-w-[200px]">
                      {treatment.description}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                    {treatment.category}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Clock className="w-4 h-4" />
                    {treatment.duration}min
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    <Euro className="w-4 h-4" />
                    {treatment.price}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">€{treatment.materialCost}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm font-medium ${getMarginColor(treatment.margin)}`}>
                    {treatment.margin}%
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`status-chip ${getPopularityColor(treatment.popularity)}`}>
                    {treatment.popularity}%
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Calendar className="w-4 h-4" />
                    {treatment.bookingsThisMonth}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    {treatment.rating}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`status-chip ${
                    treatment.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {treatment.active ? 'Actief' : 'Inactief'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onTreatmentEdit(treatment.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}