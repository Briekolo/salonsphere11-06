'use client'

import { useMemo } from 'react'
import { useStaffWithServices } from './useStaffServices'
import { StaffMember, StaffService } from '@/types/staff'

/**
 * Custom hook to get staff members available for a specific service
 * @param serviceId - The service ID to filter staff by
 * @returns Array of staff members who can perform the service
 */
export function useAvailableStaff(serviceId: string | null) {
  const { data: staffWithServices, isLoading } = useStaffWithServices()
  const staffData: StaffMember[] = staffWithServices || []

  const availableStaff = useMemo(() => {
    if (!serviceId) return staffData
    
    return staffData.filter((staffMember: StaffMember) => 
      staffMember.services.some((service: StaffService) => 
        service.service_id === serviceId && service.active
      )
    )
  }, [serviceId, staffData])

  const getStaffServiceAssignment = (staffId: string, serviceId: string): StaffService | undefined => {
    const staffMember = staffData.find((s: StaffMember) => s.id === staffId)
    return staffMember?.services.find((s: StaffService) => s.service_id === serviceId)
  }

  return {
    availableStaff,
    isLoading,
    getStaffServiceAssignment,
    allStaff: staffData
  }
}