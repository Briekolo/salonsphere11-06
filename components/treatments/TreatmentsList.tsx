'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock, Euro, Edit, MoreVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useServices, useUpdateService, useDeleteService } from '@/lib/hooks/useServices'
import { Service } from '@/lib/hooks/useServices'
import { ServiceService } from '@/lib/services/serviceService'
import { useOverheadMetrics } from '@/lib/hooks/useOverheadCalculations'

interface TreatmentsListProps {
  onTreatmentEdit: (treatmentId: string) => void
  searchTerm: string
}

export function TreatmentsList({ onTreatmentEdit, searchTerm }: TreatmentsListProps) {
  const { data: treatments = [], isLoading } = useServices()
  const { data: overheadMetrics } = useOverheadMetrics()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const updateMutation = useUpdateService()
  const deleteMutation = useDeleteService()

  const handleToggleVisibility = (treatment: Service) => {
    updateMutation.mutate({ id: treatment.id, updates: { active: !treatment.active } })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Weet je zeker dat je deze behandeling wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      deleteMutation.mutate(id)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <div className="card p-6 text-center">Bezig met laden...</div>
  }

  if (filteredTreatments.length === 0) {
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
        <p className="text-gray-600">Geen behandelingen gevonden. Voeg er eentje toe om te beginnen.</p>
      </div>
    )
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 80) return 'text-green-600'
    if (margin >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading">Alle behandelingen</h2>
        <div className="text-sm text-gray-600">
          {filteredTreatments.length} behandelingen gevonden
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Behandeling</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Duur</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Prijs</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Sessies</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Overhead</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Marge</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {filteredTreatments.map((treatment: Service) => (
              <tr 
                key={treatment.id} 
                className={`border-b border-gray-100 transition-colors ${!treatment.active ? 'bg-gray-50 text-gray-500' : 'hover:bg-gray-50'}`}
              >
                <td className="py-4 px-4">
                  <div>
                    <div className={`font-medium ${!treatment.active ? 'text-gray-500' : 'text-gray-900'}`}>{treatment.name}</div>
                    <div className="text-sm truncate max-w-[200px]">
                      {treatment.description}
                    </div>
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
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4" />
                    {treatment.duration_minutes}min
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Euro className="w-4 h-4" />
                    {treatment.price}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                    {treatment.aantal_sessies ?? 1}x
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">
                    {overheadMetrics ? `€${overheadMetrics.overhead_per_treatment.toFixed(2)}` : '--'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm font-medium ${
                    overheadMetrics 
                      ? getMarginColor(ServiceService.calculateMarginWithOverhead(treatment.price, treatment.material_cost ?? 0, overheadMetrics.overhead_per_treatment))
                      : getMarginColor(ServiceService.calculateMargin(treatment.price, treatment.material_cost ?? 0))
                  }`}>
                    {overheadMetrics 
                      ? ServiceService.calculateMarginWithOverhead(treatment.price, treatment.material_cost ?? 0, overheadMetrics.overhead_per_treatment).toFixed(1)
                      : ServiceService.calculateMargin(treatment.price, treatment.material_cost ?? 0).toFixed(1)
                    }%
                  </span>
                  {overheadMetrics && (
                    <div className="text-xs text-gray-500">incl. overhead</div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-1 relative">
                    <button 
                      onClick={() => handleToggleVisibility(treatment)}
                      className="p-2 hover:bg-gray-200 rounded-full"
                      title={treatment.active ? 'Verbergen' : 'Zichtbaar maken'}
                    >
                      {treatment.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => onTreatmentEdit(treatment.id)}
                      className="p-2 hover:bg-gray-200 rounded-full"
                      title="Bewerken"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === treatment.id ? null : treatment.id)}
                      className="p-2 hover:bg-gray-200 rounded-full"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === treatment.id && (
                      <div
                        ref={menuRef}
                        className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10"
                      >
                        <ul>
                          <li>
                            <button
                              onClick={() => { handleDelete(treatment.id); setOpenMenuId(null); }}
                              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Verwijderen
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
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