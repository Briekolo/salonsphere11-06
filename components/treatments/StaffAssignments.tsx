'use client'

import { useState } from 'react'
import { Check, X, User, Clock, Euro, Search, Filter, ChevronDown, UserPlus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useServices } from '@/lib/hooks/useServices'
import { useTreatmentCategories } from '@/lib/hooks/useTreatmentCategories'
import { 
  useStaffWithServices, 
  useAssignServiceToStaff, 
  useRemoveServiceFromStaff,
  useUpdateStaffService,
  type StaffService 
} from '@/lib/hooks/useStaffServices'


interface ServiceCellProps {
  staffId: string
  serviceId: string
  assignment?: StaffService
  onToggle: () => void
  onUpdate: (updates: Partial<StaffService>) => void
}

function ServiceCell({ staffId, serviceId, assignment, onToggle, onUpdate }: ServiceCellProps) {
  const [showDetails, setShowDetails] = useState(false)


  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`w-full h-20 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
          assignment
            ? 'bg-green-50 border-green-300 hover:bg-green-100'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
      >
        {assignment ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <div className="w-5 h-5 border-2 border-gray-300 rounded" />
        )}
      </button>

      {assignment && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(!showDetails)
          }}
          className="absolute top-1 right-1 p-1 hover:bg-white/80 rounded"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
      )}

      {showDetails && assignment && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 p-3 bg-white border rounded-lg shadow-lg">
          <div className="space-y-2">

            <div>
              <label className="text-xs font-medium text-gray-700">Aangepaste duur (min)</label>
              <input
                type="number"
                value={assignment.custom_duration_minutes || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null
                  // Round to nearest 15 minutes if value is provided
                  const roundedValue = value ? Math.round(value / 15) * 15 : null
                  onUpdate({ custom_duration_minutes: roundedValue })
                }}
                placeholder="Standaard"
                className="w-full mt-1 text-xs px-2 py-1 border rounded"
                min="15"
                step="15"
              />
              <p className="text-xs text-gray-400 mt-1">Veelvouden van 15 min</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Aangepaste prijs (€)</label>
              <input
                type="number"
                step="0.01"
                value={assignment.custom_price || ''}
                onChange={(e) => onUpdate({ custom_price: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Standaard"
                className="w-full mt-1 text-xs px-2 py-1 border rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function StaffAssignments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const { data: services = [], isLoading: servicesLoading } = useServices()
  const { data: categories = [] } = useTreatmentCategories()
  const { data: staffWithServices = [], isLoading: staffLoading } = useStaffWithServices()
  
  const assignMutation = useAssignServiceToStaff()
  const removeMutation = useRemoveServiceFromStaff()
  const updateMutation = useUpdateStaffService()

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory
    return matchesSearch && matchesCategory && service.active
  })

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const category = categories.find(c => c.id === service.category_id)
    const categoryName = category?.name || 'Overig'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(service)
    return acc
  }, {} as Record<string, typeof services>)

  const handleToggleAssignment = async (staffId: string, serviceId: string) => {
    try {
      const staff = staffWithServices.find(s => s.id === staffId)
      const existingAssignment = staff?.services.find(s => s.service_id === serviceId)

      if (existingAssignment) {
        await removeMutation.mutateAsync({ staff_id: staffId, service_id: serviceId })
      } else {
        await assignMutation.mutateAsync({ staff_id: staffId, service_id: serviceId })
      }
    } catch (error) {
      console.error('Error toggling assignment:', error)
    }
  }

  const handleUpdateAssignment = async (assignmentId: string, updates: Partial<StaffService>) => {
    await updateMutation.mutateAsync({ id: assignmentId, updates })
  }

  if (servicesLoading || staffLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg" />
        <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Behandeling toewijzingen</h2>
          <p className="text-sm text-gray-600">
            Wijs behandelingen toe aan medewerkers en stel hun vaardigheidsniveau in
          </p>
        </div>
        <Link 
          href="/admin/staff" 
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Medewerkers Beheren
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Zoek behandeling..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Alle categorieën</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Matrix View */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] bg-white rounded-lg border">
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 border-b">
            <div className="flex">
              <div className="w-48 p-4 font-semibold text-sm text-gray-700">
                Medewerker
              </div>
              <div className="flex-1">
                {/* Service categories headers */}
                {Object.entries(servicesByCategory).map(([categoryName, categoryServices]) => (
                  <div key={categoryName} className="border-l">
                    <div className="px-4 py-2 bg-gray-100 font-semibold text-sm text-gray-700">
                      {categoryName}
                    </div>
                    <div className="flex">
                      {categoryServices.map(service => (
                        <div
                          key={service.id}
                          className="flex-1 min-w-[120px] p-2 text-xs text-center text-gray-600 border-l"
                          title={service.name}
                        >
                          <div className="truncate">{service.name}</div>
                          <div className="text-gray-400">
                            {service.duration_minutes}min • €{service.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staff rows */}
          <div className="divide-y">
            {staffWithServices.map(staff => (
              <div key={staff.id} className="flex hover:bg-gray-50">
                <div className="w-48 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {staff.first_name} {staff.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {staff.services.length} behandelingen
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex">
                  {Object.entries(servicesByCategory).map(([categoryName, categoryServices]) => (
                    <div key={categoryName} className="flex border-l">
                      {categoryServices.map(service => {
                        const assignment = staff.services.find(s => s.service_id === service.id)
                        return (
                          <div key={service.id} className="flex-1 min-w-[120px] p-2 border-l">
                            <ServiceCell
                              staffId={staff.id}
                              serviceId={service.id}
                              assignment={assignment}
                              onToggle={() => handleToggleAssignment(staff.id, service.id)}
                              onUpdate={(updates) => assignment && handleUpdateAssignment(assignment.id, updates)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {staffWithServices.length === 0 && (
            <div className="p-8 text-center">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen medewerkers gevonden</h3>
              <p className="text-gray-600 mb-6">
                U moet eerst medewerkers toevoegen voordat u ze aan behandelingen kunt toewijzen.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/admin/staff" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Voeg Medewerkers Toe
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <p className="text-sm text-gray-500">
                  Ga naar Admin Panel → Medewerkers om je team toe te voegen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded" />
          <span>Toegewezen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded" />
          <span>Niet toegewezen</span>
        </div>
      </div>
    </div>
  )
}