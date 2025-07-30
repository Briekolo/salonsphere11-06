'use client'

import { useState } from 'react'
import { User, Sparkles, BarChart3 } from 'lucide-react'
import { StaffCentricView } from './staff-assignments/StaffCentricView'
import { ServiceCentricView } from './staff-assignments/ServiceCentricView'
import { AssignmentOverview } from './staff-assignments/AssignmentOverview'
import { VIEW_OPTIONS, type ViewType } from './staff-assignments/constants'
import { 
  useStaffWithServices,
  useAssignServiceToStaff, 
  useRemoveServiceFromStaff,
  useUpdateStaffService 
} from '@/lib/hooks/useStaffServices'

const iconMap = {
  User,
  Sparkles,
  BarChart3
}

export function StaffAssignmentsV2() {
  const [activeView, setActiveView] = useState<ViewType>('overview')
  const [initialStaffId, setInitialStaffId] = useState<string>('')
  const [initialServiceId, setInitialServiceId] = useState<string>('')
  
  const { data: staffWithServices = [] } = useStaffWithServices()
  const assignServiceToStaff = useAssignServiceToStaff()
  const removeServiceFromStaff = useRemoveServiceFromStaff()
  const updateStaffService = useUpdateStaffService()

  const handleToggleAssignment = async (staffId: string, serviceId: string) => {
    // Check if assignment already exists
    const staff = staffWithServices.find(s => s.id === staffId)
    const existingAssignment = staff?.services.find(s => s.service_id === serviceId)
    
    try {
      if (existingAssignment) {
        // Remove existing assignment
        await removeServiceFromStaff.mutateAsync({ 
          staff_id: staffId, 
          service_id: serviceId
        })
      } else {
        // Create new assignment
        await assignServiceToStaff.mutateAsync({ 
          staff_id: staffId, 
          service_id: serviceId 
        })
      }
    } catch (error) {
      console.error('Error toggling assignment:', error)
      // You could add a toast notification here for user feedback
    }
  }

  const handleUpdateAssignment = async (assignmentId: string, updates: any) => {
    try {
      await updateStaffService.mutateAsync({ id: assignmentId, updates })
    } catch (error) {
      console.error('Error updating assignment:', error)
      // You could add a toast notification here for user feedback
    }
  }

  const handleSwitchToStaffView = (staffId: string) => {
    setInitialStaffId(staffId)
    setActiveView('staff')
  }

  const handleSwitchToServiceView = (serviceId: string) => {
    setInitialServiceId(serviceId)
    setActiveView('service')
  }

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent || User
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Medewerker Toewijzingen
            </h2>
            <p className="text-gray-600 mt-1">
              Beheer welke behandelingen elke medewerker kan uitvoeren
            </p>
          </div>

          {/* View Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {VIEW_OPTIONS.map((option) => {
              const Icon = getIcon(option.icon)
              return (
                <button
                  key={option.value}
                  onClick={() => setActiveView(option.value)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${activeView === option.value
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeView === 'overview' && (
          <AssignmentOverview
            onSwitchToStaffView={handleSwitchToStaffView}
            onSwitchToServiceView={handleSwitchToServiceView}
          />
        )}

        {activeView === 'staff' && (
          <StaffCentricView
            onToggleAssignment={handleToggleAssignment}
            onUpdateAssignment={handleUpdateAssignment}
          />
        )}

        {activeView === 'service' && (
          <ServiceCentricView
            onToggleAssignment={handleToggleAssignment}
            onUpdateAssignment={handleUpdateAssignment}
          />
        )}
      </div>

      {/* Loading States */}
      {(assignServiceToStaff.isPending || 
        removeServiceFromStaff.isPending || 
        updateStaffService.isPending) && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Opslaan...</span>
          </div>
        </div>
      )}
    </div>
  )
}