'use client'

import { useState, useMemo } from 'react'
import { Search, User, UserPlus, Copy, CheckSquare, Square } from 'lucide-react'
import { AssignmentCard } from './AssignmentCard'
import { useServices } from '@/lib/hooks/useServices'
import { useTreatmentCategories } from '@/lib/hooks/useTreatmentCategories'
import { 
  useStaffWithServices, 
  useAssignServiceToStaff, 
  useRemoveServiceFromStaff,
  useUpdateStaffService,
  type StaffWithServices 
} from '@/lib/hooks/useStaffServices'

interface StaffCentricViewProps {
  onToggleAssignment: (staffId: string, serviceId: string) => void
  onUpdateAssignment: (assignmentId: string, updates: any) => void
}

export function StaffCentricView({ onToggleAssignment, onUpdateAssignment }: StaffCentricViewProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
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

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped = filteredServices.reduce((acc, service) => {
      const categoryName = service.treatment_categories?.name || 'Overig'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(service)
      return acc
    }, {} as Record<string, typeof services>)
    
    return grouped
  }, [filteredServices])

  const selectedStaff = staffWithServices.find(staff => staff.id === selectedStaffId)

  const handleBulkAssign = (categoryServices: typeof services, assign: boolean) => {
    if (!selectedStaffId) return
    
    categoryServices.forEach(service => {
      const hasAssignment = selectedStaff?.services.some(s => s.service_id === service.id)
      if (assign && !hasAssignment) {
        onToggleAssignment(selectedStaffId, service.id)
      } else if (!assign && hasAssignment) {
        onToggleAssignment(selectedStaffId, service.id)
      }
    })
  }

  if (staffWithServices.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen medewerkers gevonden</h3>
        <p className="text-gray-600">
          Voeg eerst medewerkers toe om behandelingen toe te wijzen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Staff Selection */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Selecteer Medewerker</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staffWithServices.map(staff => (
            <button
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${selectedStaffId === staff.id 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {staff.first_name} {staff.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {staff.services.length} behandelingen
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedStaff && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-4">
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
          </div>

          {/* Services by Category */}
          <div className="space-y-6">
            {Object.entries(servicesByCategory).map(([categoryName, categoryServices]) => {
              const assignedCount = categoryServices.filter(service => 
                selectedStaff.services.some(s => s.service_id === service.id)
              ).length
              const totalCount = categoryServices.length
              
              return (
                <div key={categoryName} className="bg-white rounded-lg border">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {categoryName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {assignedCount} van {totalCount} toegewezen
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBulkAssign(categoryServices, true)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          disabled={assignedCount === totalCount}
                        >
                          <CheckSquare className="w-4 h-4" />
                          Alles toewijzen
                        </button>
                        <button
                          onClick={() => handleBulkAssign(categoryServices, false)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          disabled={assignedCount === 0}
                        >
                          <Square className="w-4 h-4" />
                          Alles verwijderen
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryServices.map(service => {
                        const assignment = selectedStaff.services.find(s => s.service_id === service.id)
                        
                        return (
                          <AssignmentCard
                            key={service.id}
                            service={service}
                            assignment={assignment}
                            onToggle={() => onToggleAssignment(selectedStaff.id, service.id)}
                            onUpdate={(updates) => assignment && onUpdateAssignment(assignment.id, updates)}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {Object.keys(servicesByCategory).length === 0 && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Geen behandelingen gevonden
              </h3>
              <p className="text-gray-600">
                Probeer een andere zoekopdracht of filter.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}