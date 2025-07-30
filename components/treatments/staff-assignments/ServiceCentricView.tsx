'use client'

import { useState, useMemo } from 'react'
import { Search, Sparkles, User, Award, Clock, Euro, ChevronDown, ChevronUp } from 'lucide-react'
import { useServices } from '@/lib/hooks/useServices'
import { useTreatmentCategories } from '@/lib/hooks/useTreatmentCategories'
import { 
  useStaffWithServices, 
  type StaffWithServices 
} from '@/lib/hooks/useStaffServices'

interface ServiceCentricViewProps {
  onToggleAssignment: (staffId: string, serviceId: string) => void
  onUpdateAssignment: (assignmentId: string, updates: any) => void
}

export function ServiceCentricView({ onToggleAssignment, onUpdateAssignment }: ServiceCentricViewProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState<'name'>('name')
  const [expandedStaff, setExpandedStaff] = useState<string[]>([])
  
  const { data: services = [] } = useServices()
  const { data: categories = [] } = useTreatmentCategories()
  const { data: staffWithServices = [] } = useStaffWithServices()

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || service.category_id === selectedCategory
      return matchesSearch && matchesCategory && service.active
    })
  }, [services, searchTerm, selectedCategory])

  const selectedService = services.find(service => service.id === selectedServiceId)

  // Get staff assignments for selected service
  const staffAssignments = useMemo(() => {
    if (!selectedService) return []
    
    return staffWithServices.map(staff => {
      const assignment = staff.services.find(s => s.service_id === selectedService.id)
      
      return {
        staff,
        assignment,
        isAssigned: !!assignment
      }
    }).sort((a, b) => {
      return `${a.staff.first_name} ${a.staff.last_name}`.localeCompare(
        `${b.staff.first_name} ${b.staff.last_name}`
      )
    })
  }, [selectedService, staffWithServices])

  const toggleStaffExpanded = (staffId: string) => {
    setExpandedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const assignedCount = staffAssignments.filter(s => s.isAssigned).length
  const totalCount = staffAssignments.length

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Selecteer Behandeling</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Zoek behandelingen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredServices.map(service => {
            const assignedStaffCount = staffWithServices.filter(staff =>
              staff.services.some(s => s.service_id === service.id)
            ).length
            
            return (
              <button
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${selectedServiceId === service.id 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {service.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.duration_minutes}min • €{service.price}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    {assignedStaffCount} van {staffWithServices.length}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedService && (
        <>
          {/* Service Details & Controls */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedService.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedService.duration_minutes}min
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="w-4 h-4" />
                    {selectedService.price}
                  </div>
                  <div className="text-gray-500">
                    {selectedService.treatment_categories?.name}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-600">Toegewezen aan</div>
                <div className="text-2xl font-bold text-gray-900">
                  {assignedCount} van {totalCount}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Sorteer op:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="name">Naam</option>
              </select>
            </div>
          </div>

          {/* Staff Assignments */}
          <div className="bg-white rounded-lg border">
            <div className="divide-y">
              {staffAssignments.map(({ staff, assignment, isAssigned }) => {
                const isExpanded = expandedStaff.includes(staff.id)
                
                return (
                  <div key={staff.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {staff.first_name} {staff.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {staff.services.length} behandelingen toegewezen
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {assignment && (
                          <div className="text-sm text-gray-600">
                            {assignment.custom_duration_minutes || selectedService.duration_minutes}min • 
                            €{assignment.custom_price || selectedService.price}
                          </div>
                        )}
                        
                        <button
                          onClick={() => onToggleAssignment(staff.id, selectedService.id)}
                          className={`
                            px-4 py-2 rounded-lg font-medium transition-colors
                            ${isAssigned 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }
                          `}
                        >
                          {isAssigned ? 'Verwijderen' : 'Toewijzen'}
                        </button>

                        {assignment && (
                          <button
                            onClick={() => toggleStaffExpanded(staff.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {assignment && isExpanded && (
                      <div className="mt-4 ml-13 pl-4 border-l-2 border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Aangepaste duur (min)
                            </label>
                            <input
                              type="number"
                              value={assignment.custom_duration_minutes || ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : null
                                // Round to nearest 15 minutes if value is provided
                                const roundedValue = value ? Math.round(value / 15) * 15 : null
                                onUpdateAssignment(assignment.id, { custom_duration_minutes: roundedValue })
                              }}
                              placeholder={`Standaard: ${selectedService.duration_minutes}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              min="15"
                              step="15"
                            />
                            <p className="text-xs text-gray-500 mt-1">Veelvouden van 15 minuten</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Aangepaste prijs (€)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={assignment.custom_price || ''}
                              onChange={(e) => onUpdateAssignment(assignment.id, { 
                                custom_price: e.target.value ? parseFloat(e.target.value) : null 
                              })}
                              placeholder={`Standaard: €${selectedService.price}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {staffAssignments.length === 0 && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Geen medewerkers gevonden
              </h3>
              <p className="text-gray-600">
                Voeg eerst medewerkers toe om behandelingen toe te wijzen.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}