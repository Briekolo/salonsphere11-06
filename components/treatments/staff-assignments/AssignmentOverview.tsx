'use client'

import { useMemo } from 'react'
import { BarChart3, Users, Sparkles, AlertTriangle, TrendingUp, Award } from 'lucide-react'
import { useServices } from '@/lib/hooks/useServices'
import { useTreatmentCategories } from '@/lib/hooks/useTreatmentCategories'
import { useStaffWithServices } from '@/lib/hooks/useStaffServices'

interface AssignmentOverviewProps {
  onSwitchToStaffView: (staffId: string) => void
  onSwitchToServiceView: (serviceId: string) => void
}

export function AssignmentOverview({ onSwitchToStaffView, onSwitchToServiceView }: AssignmentOverviewProps) {
  const { data: services = [] } = useServices()
  const { data: categories = [] } = useTreatmentCategories()
  const { data: staffWithServices = [] } = useStaffWithServices()

  const stats = useMemo(() => {
    const activeServices = services.filter(s => s.active)
    const totalStaff = staffWithServices.length
    const totalServices = activeServices.length
    
    // Calculate coverage statistics
    const totalPossibleAssignments = totalStaff * totalServices
    const actualAssignments = staffWithServices.reduce((sum, staff) => sum + staff.services.length, 0)
    const coveragePercentage = totalPossibleAssignments > 0 ? (actualAssignments / totalPossibleAssignments) * 100 : 0
    
    // Find unassigned services
    const unassignedServices = activeServices.filter(service => 
      !staffWithServices.some(staff => 
        staff.services.some(s => s.service_id === service.id)
      )
    )
    
    // Staff with most assignments
    const topStaff = [...staffWithServices]
      .sort((a, b) => b.services.length - a.services.length)
      .slice(0, 5)
    
    // Most assigned services
    const serviceAssignmentCounts = activeServices.map(service => ({
      service,
      assignmentCount: staffWithServices.filter(staff => 
        staff.services.some(s => s.service_id === service.id)
      ).length
    })).sort((a, b) => b.assignmentCount - a.assignmentCount)
    
    return {
      totalStaff,
      totalServices,
      actualAssignments,
      coveragePercentage,
      unassignedServices,
      topStaff,
      serviceAssignmentCounts: serviceAssignmentCounts.slice(0, 10)
    }
  }, [services, staffWithServices])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Medewerkers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Behandelingen</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toewijzingen</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.actualAssignments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dekking</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.coveragePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Services */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Niet-toegewezen Behandelingen</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                {stats.unassignedServices.length}
              </span>
            </div>
          </div>
          <div className="p-4">
            {stats.unassignedServices.length > 0 ? (
              <div className="space-y-2">
                {stats.unassignedServices.slice(0, 8).map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => onSwitchToServiceView(service.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-gray-500">
                        {service.duration_minutes}min • €{service.price}
                      </div>
                    </div>
                    <button className="text-xs text-primary-600 hover:text-primary-800">
                      Toewijzen →
                    </button>
                  </div>
                ))}
                {stats.unassignedServices.length > 8 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    +{stats.unassignedServices.length - 8} meer...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-600 mb-2">✓</div>
                <p className="text-sm text-gray-600">
                  Alle behandelingen zijn toegewezen!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Staff */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Meeste Toewijzingen</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {stats.topStaff.map((staff, index) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => onSwitchToStaffView(staff.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {staff.first_name} {staff.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {staff.services.length} behandelingen
                      </div>
                    </div>
                  </div>
                  <button className="text-xs text-primary-600 hover:text-primary-800">
                    Bekijk →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Assigned Services */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Populaire Behandelingen</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {stats.serviceAssignmentCounts.map(({ service, assignmentCount }) => {
                const percentage = stats.totalStaff > 0 ? (assignmentCount / stats.totalStaff) * 100 : 0
                
                return (
                  <div key={service.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{service.name}</span>
                      <span className="text-gray-500">
                        {assignmentCount}/{stats.totalStaff}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}